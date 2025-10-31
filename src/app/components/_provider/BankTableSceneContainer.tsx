import { useCallback, useEffect, useMemo, useState } from "react";
import { compact } from "~/common/lib/array-util";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import MonthCursorNavi from "~/app/components/MonthCursorNavi";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import ErrorPopup from "~/app/components/ErrorPopup";
import CardSnapshotFormPopup from "~/app/components/CardSnapshotPopup";
import BankSnapshotFormPopup from "~/app/components/BankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import BankTableScene, {
  calcRangeDayArray,
  type PopupParams
} from "~/app/components/BankTableScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import useMonthCursor from "~/app/lib/useMonthCursor";
import { PAGE_TOP } from "~/app/lib/page-path";

const PERIOD_OPTIONS = [3, 12, 24];

const useBankSimulatorPageQuery = () => {
  const { params, setParams } = usePageEntryQuery(PAGE_TOP);

  const bankId = useMemo(() => params.bank, [params]);
  const monthCode = useMemo(() => parseNumber(params.month), [params]);
  const period = useMemo(() => {
    const n = parseNumber(params.period);
    return PERIOD_OPTIONS.includes(n) ? n : PERIOD_OPTIONS[0];
  }, [params]);

  const setBankId = useCallback(
    (v: string) =>
      setParams({
        bank: v,
        month: parseString(monthCode),
        period: parseString(period)
      }),
    [monthCode, period, setParams]
  );
  const setMonthCode = useCallback(
    (v: number) =>
      setParams({
        bank: bankId,
        month: parseString(v),
        period: parseString(period)
      }),
    [bankId, period, setParams]
  );
  const setPeriod = useCallback(
    (v: number) =>
      setParams({
        bank: bankId,
        month: parseString(monthCode),
        period: parseString(v)
      }),
    [bankId, monthCode, setParams]
  );

  return { bankId, monthCode, period, setBankId, setMonthCode, setPeriod };
};

const BankTableSceneContainer = () => {
  const { myId } = useAuthorizedUser();
  const {
    bankAccountList: bankList,
    cardAccountList: cardList,
    moneyPlanList: planList
  } = useCommonMoneyStore();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const [graphMode, setGraphMode] = useState(false);
  const [popup, setPopup] = useState<PopupParams | null>(null);
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const { bankId, monthCode, period, setBankId, setMonthCode, setPeriod } =
    useBankSimulatorPageQuery();

  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode,
    startDay: 5,
    period
  });

  const startDate = useMemo(
    () => monthCursor.minTimestamp,
    [monthCursor.minTimestamp]
  );

  const endDate = useMemo(
    () => monthCursor.maxTimestamp,
    [monthCursor.maxTimestamp]
  );

  const { bankSnapshotList, createBankSnapshot, writeBankSnapshot } =
    useBankSnapshotList({
      userId: myId,
      bankId: bankId || "",
      minTimestamp: startDate,
      maxTimestamp: endDate,
      onError: setStatusError
    });
  const { bankSnapshotList: beforeSnapshotList } = useBankSnapshotList({
    userId: myId,
    bankId: bankId || "",
    maxTimestamp: startDate,
    limit: 1,
    onError: setStatusError
  });
  const { cardSnapshotList, createCardSnapshot } = useCardSnapshotList({
    // TODO: 全件検索やめたいね
    userId: myId,
    onError: setStatusError
  });
  const { writeMoneyPlan } = useMyMoneyPlanTools();

  const lastBankSnapshot = useMemo(() => {
    const [first] = beforeSnapshotList || [];
    return first ? first.data : null;
  }, [beforeSnapshotList]);

  const cardTerms = useMemo(
    () =>
      (startDate
        ? calcRangeDayArray(
            Math.min(
              startDate,
              lastBankSnapshot ? lastBankSnapshot.timestamp : startDate
            ),
            endDate
          )
        : []
      )
        .map(({ year, month, day }) =>
          compact(
            (cardList || []).map(({ id, data: card }) => {
              if (card.startDay !== day || card.bankId !== bankId) {
                return null;
              }

              const d = new Date(year, month - 1, day);
              const termEndDate = new Date(d);
              termEndDate.setMonth(termEndDate.getMonth() - 1);
              const termEnd = termEndDate.getTime();
              const termStartDate = new Date(termEndDate);
              termStartDate.setMonth(termStartDate.getMonth() - 1);
              const termStart = termStartDate.getTime();

              const snapshotList = (cardSnapshotList || []).filter(
                ({ data: snapshot }) =>
                  snapshot.cardId === id &&
                  snapshot.timestamp >= termStart &&
                  snapshot.timestamp < termEnd
              );

              return {
                cardId: id,
                year,
                month,
                day,
                label: card.label,
                termStart,
                termEnd,
                snapshotList
              };
            })
          )
        )
        .flat(),
    [startDate, lastBankSnapshot, endDate, cardList, bankId, cardSnapshotList]
  );

  const currentBank = useMemo(() => {
    if (!bankList || !bankId) {
      return null;
    }
    const matched = bankList.find(b => b.id === bankId);
    return matched ? matched.data : null;
  }, [bankId, bankList]);

  useEffect(() => {
    if (!bankList) {
      return;
    }
    const [first] = bankList;
    if (!first) {
      return;
    }
    if (!bankId || !bankList.find(({ id }) => id === bankId)) {
      setBankId(first.id);
    }
  }, [bankId, bankList, setBankId]);

  const handleCreateBankSnapshot = useCallback(
    (v: BankSnapshot) => {
      setPopup(null);
      return runAsyncHandler(() => createBankSnapshot(v));
    },
    [createBankSnapshot, runAsyncHandler]
  );

  const handleCreateCardSnapshot = useCallback(
    (v: CardSnapshot) => {
      setPopup(null);
      return runAsyncHandler(() => createCardSnapshot(v));
    },
    [createCardSnapshot, runAsyncHandler]
  );

  const handleUpdateBankSnapshot = useCallback(
    (v: BankSnapshot) => {
      if (popup?.type !== "edit-bank-snapshot") {
        return null;
      }
      setPopup(null);
      const { snapshotId } = popup;
      return runAsyncHandler(() => writeBankSnapshot(snapshotId, v));
    },
    [popup, runAsyncHandler, writeBankSnapshot]
  );

  const handleUpdatePlan = useCallback(
    (v: MoneyPlan) => {
      if (popup?.type !== "edit-plan") {
        return null;
      }
      setPopup(null);
      const { planId } = popup;
      return runAsyncHandler(() => writeMoneyPlan(planId, v));
    },
    [popup, runAsyncHandler, writeMoneyPlan]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!bankId || !currentBank || !startDate || !bankList || !planList) {
    return <p>loading...</p>;
  }

  return (
    <>
      <MonthCursorNavi monthCursor={monthCursor}>
        <select
          value={period}
          onChange={e => setPeriod(parseNumber(e.target.value))}
        >
          {PERIOD_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}ヶ月
            </option>
          ))}
        </select>
      </MonthCursorNavi>
      {bankId ? (
        <div>
          <p>口座</p>
          <p>
            <select value={bankId} onChange={e => setBankId(e.target.value)}>
              {bankList.map(({ id, data }) => (
                <option key={id} value={id}>
                  {data.label}
                </option>
              ))}
            </select>
            &nbsp;
            <label>
              <input
                type="checkbox"
                checked={graphMode}
                onChange={e => setGraphMode(e.target.checked)}
              />
              graph
            </label>
          </p>
        </div>
      ) : null}
      {bankSnapshotList ? (
        <BankTableScene
          bankId={bankId}
          currentBank={currentBank}
          planList={planList}
          startDate={startDate}
          endDate={endDate}
          cardTerms={cardTerms}
          bankSnapshotList={bankSnapshotList}
          lastBankSnapshot={lastBankSnapshot}
          graphMode={graphMode}
          onPopup={setPopup}
        />
      ) : (
        <div>loading...</div>
      )}
      {popup?.type === "create-bank-snapshot" ? (
        <BankSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={() => setPopup(null)}
          onSubmit={handleCreateBankSnapshot}
        />
      ) : null}
      {popup?.type === "create-card-snapshot" ? (
        <CardSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={() => setPopup(null)}
          onSubmit={handleCreateCardSnapshot}
        />
      ) : null}
      {popup?.type === "edit-bank-snapshot" ? (
        <BankSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={() => setPopup(null)}
          onSubmit={handleUpdateBankSnapshot}
        />
      ) : null}
      {popup?.type === "edit-plan" ? (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
          {cardList ? (
            <PlanFormPopup
              defaultValue={popup.defaultValue}
              bankList={bankList}
              cardList={cardList}
              onClose={() => setPopup(null)}
              onSubmit={handleUpdatePlan}
            />
          ) : (
            <MockLoadingPopup />
          )}
        </>
      ) : null}
      {isLoading ? <MockLoadingPopup /> : null}
      {operationError ? (
        <ErrorPopup
          error={operationError}
          onClose={() => setOperationError(null)}
        />
      ) : null}
    </>
  );
};

export default BankTableSceneContainer;
