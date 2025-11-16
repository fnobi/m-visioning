import { useCallback, useMemo, useState } from "react";
import { percent } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import SimulatorTableView from "~/app/components/SimulatorTableView";
import useGraphRenderer from "~/app/lib/useGraphRenderer";
import useSimulatorRows, {
  type SimulatorRow,
  calcDateParamInt,
  type CardTerm,
  type MoneyPlanWithCardLink
} from "~/app/lib/useSimulatorRows";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

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
  cardTerms,
  startDate,
  endDate,
  planList,
  bankSnapshotList,
  lastBankSnapshot,
  onPopup
}: {
  bankId: string;
  cardTerms: CardTerm[];
  startDate: number;
  endDate: number;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  lastBankSnapshot: BankSnapshot | null;
  onPopup: (p: PopupParams) => void;
}) => {
  const [graphMode, setGraphMode] = useState(false);

  const { calcRows, calcRowsFromCardTerm } = useSimulatorRows();

  const cardPaymentPlanList = useMemo(
    () =>
      cardTerms.map<{
        id: string;
        data: MoneyPlanWithCardLink;
      }>(t => {
        const { cardId, paymentDate, sourceMonthCode, label } = t;
        const key = [sourceMonthCode, cardId].join("_");
        const { amount } = calcRowsFromCardTerm({ ...t, planList });
        return {
          id: key,
          source: "card",
          data: {
            ...paymentDate,
            repeat: null,
            price: -amount,
            label,
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
    () => [...planList, ...cardPaymentPlanList],
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
          r => r.date > (diffSnapshot?.timestamp ?? 0) && r.date <= Date.now()
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

      onPopup({
        type: "create-bank-snapshot",
        defaultValue: {
          bankId,
          amount,
          timestamp,
          detail
        }
      });
    };
  }, [bankEvents.rows, bankId, bankSnapshotList, lastBankSnapshot, onPopup]);

  const { canvasRef } = useGraphRenderer({
    isActive: graphMode,
    startDate,
    endDate,
    bankEvents
  });

  const handleRowClick = useCallback(
    (action: SimulatorRow["source"]) => {
      if (action?.type === "snapshot") {
        const m = bankSnapshotList.find(p => p.id === action.snapshotId);
        if (!m) {
          return;
        }
        onPopup({
          type: "edit-bank-snapshot",
          snapshotId: action.snapshotId,
          defaultValue: m.data
        });
      } else if (action?.type === "plan") {
        const m = planList.find(p => p.id === action.planId);
        if (!m) {
          return;
        }
        onPopup({
          type: "edit-plan",
          planId: action.planId,
          defaultValue: m.data
        });
      }
    },
    [bankSnapshotList, onPopup, planList]
  );

  return (
    <>
      <p>
        <label>
          <input
            type="checkbox"
            checked={graphMode}
            onChange={e => setGraphMode(e.target.checked)}
          />
          graph
        </label>
      </p>
      {graphMode ? (
        <div>
          <canvas
            ref={canvasRef}
            style={{
              width: percent(100),
              height: "auto"
            }}
          />
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
  );
};

export default BankTableScene;
