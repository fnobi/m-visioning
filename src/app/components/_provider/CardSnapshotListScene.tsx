import { useCallback, useMemo, useState } from "react";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
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

const CardSnapshotListScene = ({
  cardId,
  cardList,
  planList,
  monthCursor,
  onChangeCard
}: {
  cardId: string;
  cardList: TypedCollectionList<MoneyCardAccount>;
  planList: TypedCollectionList<MoneyPlan>;
  monthCursor: ReturnType<typeof useMonthCursor>;
  onChangeCard: (id: string) => void;
}) => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );

  const { cardSnapshotList, writeCardSnapshot, deleteCardSnapshot } =
    useCardSnapshotList({
      userId: myId,
      cardId,
      minTimestamp: monthCursor.minTimestamp,
      maxTimestamp: monthCursor.maxTimestamp,
      onError: setStatusError
    });
  const [editData, setEditData] = useState<{
    id: string;
    data: CardSnapshot;
  } | null>(null);

  const { calcRowsFromCardTerm } = useSimulatorRows();

  // TODO: async handler噛ませて欲しい
  const handleSubmit = useCallback(
    async (id: string, v: CardSnapshot) => {
      await writeCardSnapshot(id, v);
      setEditData(null);
    },
    [writeCardSnapshot]
  );

  const handleDeletePopupSnapshot = useCallback(async () => {
    if (!editData) {
      return;
    }
    const { id } = editData;
    await deleteCardSnapshot(id);
    setEditData(null);
  }, [deleteCardSnapshot, editData]);

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
        setEditData(m);
      }
    },
    [cardSnapshotList]
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
      {editData ? (
        <CardSnapshotFormPopup
          defaultValue={editData.data}
          onSubmit={v => handleSubmit(editData.id, v)}
          onDelete={handleDeletePopupSnapshot}
          onClose={() => setEditData(null)}
        />
      ) : null}
    </>
  );
};

export default CardSnapshotListScene;
