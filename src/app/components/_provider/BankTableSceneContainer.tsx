import { useCallback, useEffect, useMemo, useState } from "react";
import { compact } from "~/common/lib/array-util";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import usePopupOperation from "~/common/lib/usePopupOperation";
import useTypedQuery, { parseBooleanQuery } from "~/common/lib/useTypedQuery";
import PickableTitle from "~/app/components/PickableTitle";
import BankAccountFormPopup from "~/app/components/BankAccountFormPopup";
import BankSelectPopup from "~/app/components/BankSelectPopup";
import MonthCursorNavi from "~/app/components/MonthCursorNavi";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import ErrorPopup from "~/app/components/ErrorPopup";
import BankSnapshotFormPopup from "~/app/components/BankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import BankTableScene, {
  type PopupParams
} from "~/app/components/BankTableScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import useMyMoneyStore from "~/app/lib/database/useMyMoneyStore";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import useMonthCursor from "~/app/lib/useMonthCursor";
import {
  calcMonthCodeFromDate,
  calcRangeDayArray,
  type CardTerm
} from "~/app/lib/useSimulatorRows";
import { useMyBankAccountTools } from "~/app/lib/database/bank-account-database";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { parseMoneyBankAccount } from "~/app/scheme/MoneyBankAccount";

const PERIOD_OPTIONS = [3, 12, 24];

const parsePeriodNumberQuery = (src: unknown) => {
  const n = parseNumber(src);
  return PERIOD_OPTIONS.includes(n) ? n : PERIOD_OPTIONS[0];
};

const BankTableSceneContainer = () => {
  const { myId } = useAuthorizedUser();
  const {
    bankAccountList: bankList,
    cardAccountList: cardList,
    moneyPlanList: planList,
    myPageProperty
  } = useMyMoneyStore();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { popup, clearPopup, closeCurrentPopup, addPopup } =
    usePopupOperation<PopupParams>();
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const parseBankQuery = useCallback(
    (src: unknown) => {
      const options = (bankList || []).map(({ id }) => id);
      const s = parseString(src);
      return (options.includes(s) ? s : options[0]) || "";
    },
    [bankList]
  );
  const { queryValue: bankId, setQueryValue: setBankId } = useTypedQuery(
    "bank",
    parseBankQuery
  );
  const { queryValue: monthCode, setQueryValue: setMonthCode } = useTypedQuery(
    "month",
    parseNumber
  );
  const { queryValue: period, setQueryValue: setPeriod } = useTypedQuery(
    "period",
    parsePeriodNumberQuery
  );
  const { queryValue: graphMode, setQueryValue: setGraph } = useTypedQuery(
    "graph",
    parseBooleanQuery
  );

  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode,
    startDay: 1,
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

  const {
    bankSnapshotList,
    createBankSnapshot,
    writeBankSnapshot,
    deleteBankSnapshot
  } = useBankSnapshotList({
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
  const { cardSnapshotList } = useCardSnapshotList({
    // TODO: 全件検索やめたいね
    userId: myId,
    onError: setStatusError
  });
  const { createBankAccount, writeBankAccount } = useMyBankAccountTools();
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
            (cardList || []).map<CardTerm | null>(({ id, data: card }) => {
              if (card.paymentDay !== day || card.bankId !== bankId) {
                return null;
              }

              const termStartDate = new Date(
                year,
                month - 1 - card.paymentMonthOffset,
                card.startDay
              );
              const termStart = termStartDate.getTime();
              const termEndDate = new Date(termStart);
              termEndDate.setMonth(termEndDate.getMonth() + 1);
              const termEnd = termEndDate.getTime();

              const snapshotList = (cardSnapshotList || []).filter(
                ({ data: snapshot }) =>
                  snapshot.cardId === id &&
                  snapshot.timestamp >= termStart &&
                  snapshot.timestamp < termEnd
              );

              return {
                cardId: id,
                label: card.label,
                paymentDate: { year, month, day },
                sourceMonthCode: calcMonthCodeFromDate(termStartDate),
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
      clearPopup();
      return runAsyncHandler(() => createBankSnapshot(v));
    },
    [clearPopup, createBankSnapshot, runAsyncHandler]
  );

  const handleUpdateBankSnapshot = useCallback(
    (v: BankSnapshot) => {
      if (popup?.type !== "edit-bank-snapshot") {
        return null;
      }
      clearPopup();
      const { snapshotId } = popup;
      return runAsyncHandler(() => writeBankSnapshot(snapshotId, v));
    },
    [clearPopup, popup, runAsyncHandler, writeBankSnapshot]
  );

  const handleDeletePopupSnapshot = useCallback(async () => {
    if (popup?.type !== "edit-bank-snapshot") {
      return null;
    }
    clearPopup();
    const { snapshotId } = popup;
    return runAsyncHandler(() => deleteBankSnapshot(snapshotId));
  }, [clearPopup, deleteBankSnapshot, popup, runAsyncHandler]);

  const handleUpdateBankAccount = useCallback(
    (v: MoneyBankAccount) => {
      if (popup?.type !== "edit-bank-account") {
        return null;
      }
      clearPopup();
      const { bankId: id } = popup;
      return runAsyncHandler(() => writeBankAccount(id, v));
    },
    [clearPopup, popup, runAsyncHandler, writeBankAccount]
  );

  const handleCreateBankAccount = useCallback(
    (v: MoneyBankAccount) => {
      if (popup?.type !== "create-bank-account") {
        return null;
      }
      clearPopup();
      return runAsyncHandler(() => createBankAccount(v));
    },
    [clearPopup, createBankAccount, popup?.type, runAsyncHandler]
  );

  const handleUpdatePlan = useCallback(
    (v: MoneyPlan) => {
      if (popup?.type !== "edit-plan") {
        return null;
      }
      clearPopup();
      const { planId } = popup;
      return runAsyncHandler(() => writeMoneyPlan(planId, v));
    },
    [clearPopup, popup, runAsyncHandler, writeMoneyPlan]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (
    !bankId ||
    !currentBank ||
    !startDate ||
    !bankList ||
    !cardList ||
    !planList ||
    !myPageProperty
  ) {
    return <p>loading...</p>;
  }

  return (
    <>
      <PickableTitle
        type="bank"
        onOpen={() => addPopup({ type: "select-bank" })}
        onEdit={() =>
          addPopup({
            type: "edit-bank-account",
            bankId,
            defaultValue: currentBank
          })
        }
      >
        {currentBank.label}
      </PickableTitle>
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
      {bankSnapshotList ? (
        <BankTableScene
          bankId={bankId}
          planList={planList}
          startDate={startDate}
          endDate={endDate}
          cardTerms={cardTerms}
          graphMode={graphMode}
          bankSnapshotList={bankSnapshotList}
          lastBankSnapshot={lastBankSnapshot}
          myPageProperty={myPageProperty}
          bankList={bankList}
          cardList={cardList}
          onPopup={addPopup}
          onChangeGraphMode={setGraph}
        />
      ) : (
        <div>loading...</div>
      )}
      {popup?.type === "create-bank-snapshot" ? (
        <BankSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={closeCurrentPopup}
          onSubmit={handleCreateBankSnapshot}
        />
      ) : null}
      {popup?.type === "edit-bank-snapshot" ? (
        <BankSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={closeCurrentPopup}
          onDelete={handleDeletePopupSnapshot}
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
              onClose={closeCurrentPopup}
              onSubmit={handleUpdatePlan}
            />
          ) : (
            <MockLoadingPopup />
          )}
        </>
      ) : null}
      {popup?.type === "select-bank" ? (
        <BankSelectPopup
          defaultValue={bankId}
          bankList={bankList}
          onCreate={v =>
            addPopup({
              type: "create-bank-account",
              defaultValue: parseMoneyBankAccount(v)
            })
          }
          onClose={closeCurrentPopup}
          onSubmit={v => {
            closeCurrentPopup();
            setBankId(v);
          }}
        />
      ) : null}
      {popup?.type === "edit-bank-account" ? (
        <BankAccountFormPopup
          defaultValue={popup.defaultValue}
          onSubmit={handleUpdateBankAccount}
          onClose={closeCurrentPopup}
        />
      ) : null}
      {popup?.type === "create-bank-account" ? (
        <BankAccountFormPopup
          defaultValue={popup.defaultValue}
          onSubmit={handleCreateBankAccount}
          onClose={closeCurrentPopup}
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
