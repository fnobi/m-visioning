import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useState
} from "react";
import MockListView from "~/common/components/MockListView";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import CardSnapshotFormPopup from "~/app/components/CardSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

const CardSnapshotListScene = ({
  cardId,
  cardList,
  onChangeCard
}: {
  cardId: string;
  cardList: TypedCollectionList<MoneyCardAccount>;
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
      onError: setStatusError
    });
  const [editData, setEditData] = useState<{
    id: string;
    data: CardSnapshot;
  } | null>(null);

  // TODO: async handler噛ませて欲しい
  const handleSubmit = useCallback(
    async (id: string, v: CardSnapshot) => {
      await writeCardSnapshot(id, v);
      setEditData(null);
    },
    [writeCardSnapshot]
  );

  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] | null =>
      cardSnapshotList
        ? cardSnapshotList.map(({ id, data }) => ({
            key: id,
            title: `¥${data.amount}`,
            subTitle: formatDateTimeLabel(data.timestamp),
            mainAction: {
              type: "button",
              onClick: () => setEditData({ id, data })
            },
            actions: [
              {
                children: "削除",
                action: {
                  type: "button",
                  onClick: () => deleteCardSnapshot(id)
                }
              }
            ]
          }))
        : null,
    [cardSnapshotList, deleteCardSnapshot]
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
      {list ? <MockListView dataList={list} /> : <>loading...</>}
      {editData ? (
        <CardSnapshotFormPopup
          defaultValue={editData.data}
          onSubmit={v => handleSubmit(editData.id, v)}
          onClose={() => setEditData(null)}
        />
      ) : null}
    </>
  );
};

export default CardSnapshotListScene;
