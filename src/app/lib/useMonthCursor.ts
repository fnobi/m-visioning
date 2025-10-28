import { useCallback, useEffect, useMemo } from "react";

const useMonthCursor = ({
  monthCode,
  setMonthCode,
  startDay
}: {
  monthCode: number;
  setMonthCode: (v: number) => void;
  startDay: number;
}) => {
  const monthStartDate = useMemo(() => {
    if (!monthCode) {
      return null;
    }
    const y = Math.floor(monthCode / 100);
    const m = monthCode % 100;
    return new Date(y, m - 1, startDay);
  }, [monthCode, startDay]);

  const minTimestamp = useMemo(
    () => (monthStartDate ? monthStartDate.getTime() : 0),
    [monthStartDate]
  );

  const maxTimestamp = useMemo(() => {
    if (!monthStartDate) {
      return 0;
    }
    const endDate = new Date(monthStartDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate.getTime();
  }, [monthStartDate]);

  const setMonthCodeWithDate = useCallback(
    (d: Date) => setMonthCode(d.getFullYear() * 100 + (d.getMonth() + 1)),
    [setMonthCode]
  );

  const incrementMonthCode = useCallback(
    (delta: number) => {
      if (!monthStartDate) {
        return;
      }
      const d = new Date(monthStartDate);
      d.setMonth(d.getMonth() + delta);
      setMonthCodeWithDate(d);
    },
    [setMonthCodeWithDate, monthStartDate]
  );

  useEffect(() => {
    if (monthCode) {
      return;
    }
    const startDate = new Date();
    if (startDate.getDate() < startDay) {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    startDate.setDate(startDay);
    setMonthCodeWithDate(startDate);
  }, [monthCode, setMonthCodeWithDate, startDay]);

  return { minTimestamp, maxTimestamp, monthStartDate, incrementMonthCode };
};

export default useMonthCursor;
