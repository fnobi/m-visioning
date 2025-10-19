import {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState
} from "react";
import MockListView from "~/common/components/MockListView";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import ErrorScene from "~/app/components/ErrorScene";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";

const CardSnapshotListScene = ({
  cardList
}: {
  cardList: TypedCollectionList<MoneyCardAccount>;
}) => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [cardId, setCardId] = useState<string>("");
  const { cardSnapshotList, deleteCardSnapshot } = useCardSnapshotList({
    userId: myId,
    cardId,
    onError: setStatusError
  });

  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] | null =>
      cardSnapshotList
        ? cardSnapshotList.map(({ id, data }) => ({
            key: id,
            title: `${data.cardId} / ¥${data.amount}`,
            subTitle: formatDateTimeLabel(data.timestamp),
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

  useEffect(() => {
    const [first] = cardList;
    if (!cardId && first) {
      setCardId(first.id);
    }
  }, [cardId, cardList]);

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return (
    <>
      <div>
        <select value={cardId} onChange={e => setCardId(e.target.value)}>
          {cardList.map(({ id, data }) => (
            <option key={id} value={id}>
              {data.label}
            </option>
          ))}
        </select>
      </div>
      {list ? <MockListView dataList={list} /> : <>loading...</>}
    </>
  );
};

export default CardSnapshotListScene;
