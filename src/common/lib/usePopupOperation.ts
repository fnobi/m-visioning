import { useCallback, useMemo, useState } from "react";

const usePopupOperation = <T>() => {
  const [popupQueue, setPopupQueue] = useState<T[]>([]);

  const popup = useMemo(() => {
    if (!popupQueue.length) {
      return null;
    }
    const [first] = popupQueue;
    return first;
  }, [popupQueue]);

  const clearPopup = useCallback(() => setPopupQueue([]), []);

  const addPopup = useCallback((p: T) => setPopupQueue(l => [p, ...l]), []);

  const closeCurrentPopup = useCallback(
    () =>
      setPopupQueue(l => {
        const [, ...r] = l;
        return r;
      }),
    []
  );

  return { popup, clearPopup, addPopup, closeCurrentPopup };
};

export default usePopupOperation;
