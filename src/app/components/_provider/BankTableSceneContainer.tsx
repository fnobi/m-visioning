import { useCallback, useEffect, useMemo, useState } from "react";
import { compact } from "~/common/lib/array-util";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import { formatDateLabel } from "~/common/lib/date-util";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import ErrorPopup from "~/app/components/ErrorPopup";
import CardSnapshotFormPopup from "~/app/components/CardSnapshotPopup";
import BankSnapshotFormPopup from "~/app/components/BankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import BankTableScene, {
  calcRangeDayArray
} from "~/app/components/BankTableScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import useAsyncHandler from "~/app/lib/useAsyncHandler";

const PERIOD_OPTIONS = [3, 12, 24];

type PopupParams =
  | {
      type: "create-bank-snapshot";
      defaultValue: BankSnapshot;
    }
  | {
      type: "create-card-snapshot";
      defaultValue: CardSnapshot;
    };

const BankTableSceneContainer = () => {
  const { myId } = useAuthorizedUser();
  const {
    bankAccountList: bankList,
    cardAccountList: cardList,
    moneyPlanList: planList
  } = useCommonMoneyStore();
  const [startDate, setStartDate] = useState(0);
  const [periodLength, setPeriodLength] = useState(PERIOD_OPTIONS[0]);
  const [bankId, setBankId] = useState<string | null>(null);
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

  const endDate = useMemo(() => {
    if (!startDate) {
      return startDate;
    }
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + periodLength);
    return d.getTime();
  }, [startDate, periodLength]);

  const { bankSnapshotList, createBankSnapshot } = useBankSnapshotList({
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

  const lastBankSnapshot = useMemo(() => {
    const [first] = beforeSnapshotList || [];
    return first ? first.data : null;
  }, [beforeSnapshotList]);

  const cardTerms = useMemo(
    () =>
      (startDate ? calcRangeDayArray(startDate, endDate) : [])
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
    [bankId, startDate, cardList, cardSnapshotList, endDate]
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
  }, [bankId, bankList]);

  useEffect(() => {
    setStartDate(v => {
      if (v) {
        return v;
      }
      const d = new Date();
      d.setDate(1);
      return d.getTime();
    });
  }, []);

  const handleOpenBankSnapshotCreateForm = useCallback(
    (d: BankSnapshot) =>
      setPopup({ type: "create-bank-snapshot", defaultValue: d }),
    []
  );

  const handleOpenCardSnapshotCreateForm = useCallback(
    (d: CardSnapshot) =>
      setPopup({ type: "create-card-snapshot", defaultValue: d }),
    []
  );

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

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!bankId || !currentBank || !startDate || !bankList || !planList) {
    return <p>loading...</p>;
  }

  return (
    <>
      <div>
        <p>期間設定</p>
        <p>
          {formatDateLabel(startDate, true)}・
          <select
            value={parseString(periodLength)}
            onChange={e => setPeriodLength(parseNumber(e.target.value))}
          >
            {PERIOD_OPTIONS.map(l => (
              <option key={l} value={l}>
                {l}ヶ月
              </option>
            ))}
          </select>
        </p>
      </div>
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
          onCreateBankSnapshot={handleOpenBankSnapshotCreateForm}
          onCreateCardSnapshot={handleOpenCardSnapshotCreateForm}
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
