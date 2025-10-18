import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import MockListView from "~/common/components/MockListView";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import ErrorScene from "~/app/components/ErrorScene";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const CardSnapshotListScene = () => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const { cardSnapshotList } = useCardSnapshotList({
    userId: myId,
    onError: setStatusError
  });
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] | null =>
      cardSnapshotList
        ? cardSnapshotList.map(({ id, data }) => ({
            key: id,
            title: `${data.cardId} / ¥${data.amount}`,
            subTitle: formatDateTimeLabel(data.timestamp)
          }))
        : null,
    [cardSnapshotList]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{list ? <MockListView dataList={list} /> : <>loading...</>}</div>;
};

export default CardSnapshotListScene;
