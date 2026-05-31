import {
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import type BankSnapshot from "@m-visioning/core/scheme/BankSnapshot";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import { parseMoneyBankAccount } from "@m-visioning/core/scheme/MoneyBankAccount";
import { compact } from "@m-visioning/core/util/array-util";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { parseNumber } from "@m-visioning/core/util/parser-helper";
import MockLoadingPopup from "~/components/MockLoadingPopup";
import usePopupOperation from "~/common/usePopupOperation";
import { percent } from "~/common/css-util";
import MockListView from "~/components/MockListView";
import MockActionButton from "~/components/MockActionButton";
import SimulatorTableView from "~/components/SimulatorTableView";
import PickableTitle from "~/components/PickableTitle";
import BankAccountFormPopup from "~/components/BankAccountFormPopup";
import BankSelectPopup from "~/components/BankSelectPopup";
import MonthCursorNavi from "~/components/MonthCursorNavi";
import PlanFormPopup from "~/components/PlanFormPopup";
import ErrorPopup from "~/components/ErrorPopup";
import BankSnapshotFormPopup from "~/components/BankSnapshotPopup";
import ErrorScene from "~/components/ErrorScene";
import { useBankSnapshotList } from "~/feature/bank-snapshot-database";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import { useCardSnapshotList } from "~/feature/card-snapshot-database";
import useMyMoneyStore from "~/feature/useMyMoneyStore";
import useAsyncHandler from "~/feature/useAsyncHandler";
import { useMyMoneyPlanTools } from "~/feature/money-plan-database";
import useMonthCursor from "~/feature/useMonthCursor";
import useSimulatorRows, {
  calcMonthCodeFromDate,
  calcRangeDayArray,
  type MoneyPlanWithCardLink,
  type CardTerm,
  type SimulatorRow,
  calcDateParamInt
} from "~/feature/useSimulatorRows";
import { useMyBankAccountTools } from "~/feature/bank-account-database";
import useGraphRenderer from "~/feature/useGraphRenderer";
import { usePlanListLabel } from "~/feature/plan-util";

export const PERIOD_OPTIONS = [3, 12, 24];

export type PopupParams =
  | {
      type: "create-bank-snapshot";
      defaultValue: BankSnapshot;
    }
  | {
      type: "edit-bank-snapshot";
      snapshotId: string;
      defaultValue: BankSnapshot;
    }
  | {
      type: "edit-plan";
      planId: string;
      defaultValue: MoneyPlan;
    }
  | {
      type: "select-bank";
    }
  | {
      type: "edit-bank-account";
      bankId: string;
      defaultValue: MoneyBankAccount;
    }
  | {
      type: "create-bank-account";
      defaultValue: MoneyBankAccount;
    };

export const calcDateInt = (d: Date) =>
  calcDateParamInt({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  });

const BankTableScene = ({
  bankId,
  monthCode,
  period,
  graphMode,
  setBankId,
  setMonthCode,
  setPeriod,
  setGraph
}: {
  bankId: string;
  monthCode: number;
  period: number;
  graphMode: boolean;
  setBankId: (v: string) => void;
  setMonthCode: (v: number) => void;
  setPeriod: (v: number) => void;
  setGraph: (v: boolean) => void;
}) => {
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
                minAmount: card.minAmount,
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

  const { calcRows, calcRowsFromCardTerm } = useSimulatorRows();
  const { calcPlanTitle, calcPlanSubTitle } = usePlanListLabel({
    bankList,
    cardList
  });

  const cardPaymentPlanList = useMemo(
    () =>
      cardTerms.map<{
        id: string;
        data: MoneyPlanWithCardLink;
      }>(t => {
        const { cardId, paymentDate, sourceMonthCode, label, minAmount } = t;
        const key = [sourceMonthCode, cardId].join("_");
        const { amount } = calcRowsFromCardTerm({
          ...t,
          planList: planList || []
        });
        return {
          id: key,
          source: "card",
          data: {
            ...paymentDate,
            repeat: null,
            price: Math.max(-amount, minAmount),
            label,
            category: "",
            from: {
              type: "bank",
              bankId
            },
            to: {
              type: "output"
            },
            cardLink: cardId
              ? {
                  cardId,
                  monthCode: sourceMonthCode
                }
              : undefined
          }
        };
      }),
    [bankId, calcRowsFromCardTerm, cardTerms, planList]
  );

  const sourcePlanList = useMemo(
    () =>
      planList && cardPaymentPlanList
        ? [...planList, ...cardPaymentPlanList]
        : [],
    [cardPaymentPlanList, planList]
  );

  const bankEvents = useMemo(
    () =>
      calcRows({
        baseSnapshot: lastBankSnapshot || undefined,
        snapshotList: bankSnapshotList,
        termStart: startDate,
        termEnd: endDate,
        nodeFilter: { type: "bank", bankId },
        sourcePlanList
      }),
    [
      calcRows,
      lastBankSnapshot,
      bankSnapshotList,
      startDate,
      endDate,
      bankId,
      sourcePlanList
    ]
  );

  const quickPlanList = useMemo(
    () =>
      compact(
        (myPageProperty ? myPageProperty.favPlanList : []).map<
          | ComponentPropsWithoutRef<typeof MockListView>["dataList"][number]
          | null
        >(planId => {
          const ent = (planList || []).find(p => p.id === planId);
          if (!ent) {
            return null;
          }
          const { data: plan } = ent;
          return {
            key: planId,
            title: calcPlanTitle(plan),
            subTitle: calcPlanSubTitle(plan),
            mainAction: {
              type: "button",
              onClick: () =>
                addPopup({
                  type: "edit-plan",
                  planId,
                  defaultValue: plan
                })
            }
          };
        })
      ),
    [myPageProperty, planList, calcPlanTitle, calcPlanSubTitle, addPopup]
  );

  const createBankSnapshotDraft = useMemo(() => {
    if (!bankId) {
      return null;
    }
    return () => {
      const timestamp = Date.now();
      const diffSnapshot =
        bankSnapshotList && bankSnapshotList.length
          ? bankSnapshotList[0].data
          : lastBankSnapshot;

      const detail: BankSnapshot["detail"] = bankEvents.rows
        .filter(
          r => r.date > (diffSnapshot?.timestamp ?? 0) && r.date <= timestamp
        )
        .map(r => ({
          label: r.label,
          price: r.price,
          date: r.date
        }));
      let amount = diffSnapshot?.amount ?? 0;
      detail.forEach(r => {
        amount += r.price;
      });

      addPopup({
        type: "create-bank-snapshot",
        defaultValue: {
          bankId,
          amount,
          timestamp,
          detail
        }
      });
    };
  }, [bankEvents.rows, bankId, bankSnapshotList, lastBankSnapshot, addPopup]);

  const { canvasRef } = useGraphRenderer({
    isActive: graphMode,
    startDate,
    endDate,
    bankEvents
  });

  const handleRowClick = useCallback(
    (action: SimulatorRow["source"]) => {
      if (action?.type === "snapshot") {
        const m = (bankSnapshotList || []).find(
          p => p.id === action.snapshotId
        );
        if (!m) {
          return;
        }
        addPopup({
          type: "edit-bank-snapshot",
          snapshotId: action.snapshotId,
          defaultValue: m.data
        });
      } else if (action?.type === "plan") {
        const m = (planList || []).find(p => p.id === action.planId);
        if (!m) {
          return;
        }
        addPopup({
          type: "edit-plan",
          planId: action.planId,
          defaultValue: m.data
        });
      }
    },
    [bankSnapshotList, addPopup, planList]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return (
    <>
      {currentBank ? (
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
      ) : null}
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
        <>
          <p>
            <label>
              <input
                type="checkbox"
                checked={graphMode}
                onChange={e => setGraph(e.target.checked)}
              />
              graph
            </label>
          </p>
          {graphMode ? (
            <div>
              <div>
                <canvas
                  ref={canvasRef}
                  style={{
                    width: percent(100),
                    height: "auto"
                  }}
                />
              </div>
              <MockListView dataList={quickPlanList} />
            </div>
          ) : (
            <>
              <p>
                <MockActionButton
                  action={
                    createBankSnapshotDraft
                      ? {
                          type: "button",
                          onClick: createBankSnapshotDraft
                        }
                      : null
                  }
                >
                  ログ追加
                </MockActionButton>
              </p>
              <SimulatorTableView
                lastSnapshot={lastBankSnapshot}
                rows={bankEvents.rows}
                onClickRow={handleRowClick}
              />
            </>
          )}
        </>
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

export default BankTableScene;
