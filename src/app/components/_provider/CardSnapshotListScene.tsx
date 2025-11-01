import { useCallback, useMemo, useState } from "react";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import SimulatorTableView from "~/app/components/SimulatorTableView";
import MonthCursorNavi from "~/app/components/MonthCursorNavi";
import CardSnapshotFormPopup from "~/app/components/CardSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import type useMonthCursor from "~/app/lib/useMonthCursor";
import useSimulatorRows, {
  type SimulatorRow
} from "~/app/lib/useSimulatorRows";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";

type PopupParams =
  | {
      type: "create-card-snapshot";
      defaultValue: CardSnapshot;
    }
  | {
      type: "edit-card-snapshot";
      snapshotId: string;
      defaultValue: CardSnapshot;
    }
  | {
      type: "edit-plan";
      planId: string;
      defaultValue: MoneyPlan;
    };

const CardSnapshotListScene = ({
  cardId,
  cardList,
  bankList,
  planList,
  monthCursor,
  onChangeCard
}: {
  cardId: string;
  cardList: TypedCollectionList<MoneyCardAccount>;
  bankList: TypedCollectionList<MoneyBankAccount>;
  planList: TypedCollectionList<MoneyPlan>;
  monthCursor: ReturnType<typeof useMonthCursor>;
  onChangeCard: (id: string) => void;
}) => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [popup, setPopup] = useState<PopupParams | null>(null);

  const { cardSnapshotList, writeCardSnapshot, deleteCardSnapshot } =
    useCardSnapshotList({
      userId: myId,
      cardId,
      minTimestamp: monthCursor.minTimestamp,
      maxTimestamp: monthCursor.maxTimestamp,
      onError: setStatusError
    });
  const { writeMoneyPlan } = useMyMoneyPlanTools();

  const { calcRowsFromCardTerm } = useSimulatorRows();

  const handleUpdateCardSnapshot = useCallback(
    async (v: CardSnapshot) => {
      if (popup?.type !== "edit-card-snapshot") {
        return null;
      }
      setPopup(null);
      const { snapshotId } = popup;
      // TODO: async handler噛ませて欲しい
      return writeCardSnapshot(snapshotId, v);
    },
    [popup, writeCardSnapshot]
  );

  const handleDeletePopupSnapshot = useCallback(async () => {
    if (popup?.type !== "edit-card-snapshot") {
      return null;
    }
    setPopup(null);
    const { snapshotId } = popup;
    // TODO: async handler噛ませて欲しい
    return deleteCardSnapshot(snapshotId);
  }, [deleteCardSnapshot, popup]);

  const handleUpdatePlan = useCallback(
    (v: MoneyPlan) => {
      if (popup?.type !== "edit-plan") {
        return null;
      }
      setPopup(null);
      const { planId } = popup;
      return writeMoneyPlan(planId, v);
    },
    [popup, writeMoneyPlan]
  );

  const rows = useMemo(() => {
    if (!cardSnapshotList) {
      return null;
    }

    const res = calcRowsFromCardTerm({
      cardId,
      snapshotList: cardSnapshotList,
      termStart: monthCursor.minTimestamp,
      termEnd: monthCursor.maxTimestamp,
      planList
    });
    return res.rows;
  }, [
    calcRowsFromCardTerm,
    cardId,
    cardSnapshotList,
    monthCursor.maxTimestamp,
    monthCursor.minTimestamp,
    planList
  ]);

  const handleRowClick = useCallback(
    (action: SimulatorRow["source"]) => {
      if (action?.type === "snapshot") {
        if (!cardSnapshotList) {
          return;
        }
        const m = cardSnapshotList.find(p => p.id === action.snapshotId);
        if (!m) {
          return;
        }
        setPopup({
          type: "edit-card-snapshot",
          snapshotId: action.snapshotId,
          defaultValue: m.data
        });
      } else if (action?.type === "plan") {
        const m = planList.find(p => p.id === action.planId);
        if (!m) {
          return;
        }
        setPopup({
          type: "edit-plan",
          planId: action.planId,
          defaultValue: m.data
        });
      }
    },
    [cardSnapshotList, planList]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return (
    <>
      <div>
        <select value={cardId} onChange={e => onChangeCard(e.target.value)}>
          {cardList.map(({ id, data }) => (
            <option key={id} value={id}>
              {data.label}
            </option>
          ))}
        </select>
      </div>
      <MonthCursorNavi monthCursor={monthCursor} />
      {rows ? (
        <SimulatorTableView
          rows={rows}
          lastSnapshot={null}
          onClickRow={handleRowClick}
        />
      ) : null}
      {popup?.type === "edit-card-snapshot" ? (
        <CardSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onSubmit={handleUpdateCardSnapshot}
          onDelete={handleDeletePopupSnapshot}
          onClose={() => setPopup(null)}
        />
      ) : null}
      {popup?.type === "edit-plan" ? (
        <PlanFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankList}
          cardList={cardList}
          onClose={() => setPopup(null)}
          onSubmit={handleUpdatePlan}
        />
      ) : null}
    </>
  );
};

export default CardSnapshotListScene;
