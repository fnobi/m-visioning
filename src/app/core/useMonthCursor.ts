import { useCallback, useEffect, useMemo, useState } from "react";
import { calcMonthCodeFromDate } from "~/app/core/useSimulatorRows";

const useMonthCursor = ({
  monthCode: srcMonthCode,
  setMonthCode,
  startDay,
  period = 1
}: {
  monthCode: number;
  setMonthCode: (v: number) => void;
  startDay: number;
  period?: number;
}) => {
  const [defaultMonthCode, setDefaultMonthCode] = useState(0);
  const monthCode = srcMonthCode || defaultMonthCode;

  const monthStartDate = useMemo(() => {
    if (!monthCode || !startDay) {
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
    endDate.setMonth(endDate.getMonth() + period);
    return endDate.getTime();
  }, [monthStartDate, period]);

  const incrementMonthCode = useCallback(
    (delta: number) => {
      if (!monthStartDate) {
        return;
      }
      const d = new Date(monthStartDate);
      d.setMonth(d.getMonth() + delta);
      setMonthCode(calcMonthCodeFromDate(d));
    },
    [monthStartDate, setMonthCode]
  );

  useEffect(() => {
    const startDate = new Date();
    if (startDate.getDate() < startDay) {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    startDate.setDate(startDay);
    setDefaultMonthCode(calcMonthCodeFromDate(startDate));
  }, [startDay]);

  return { minTimestamp, maxTimestamp, monthStartDate, incrementMonthCode };
};

export default useMonthCursor;
