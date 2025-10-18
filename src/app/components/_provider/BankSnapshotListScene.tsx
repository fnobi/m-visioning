import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import MockListView from "~/common/components/MockListView";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import ErrorScene from "~/app/components/ErrorScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const BankSnapshotListScene = () => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const { bankSnapshotList } = useBankSnapshotList({
    userId: myId,
    onError: setStatusError
  });
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] | null =>
      bankSnapshotList
        ? bankSnapshotList.map(({ id, data }) => ({
            key: id,
            title: `${data.bankId} / ¥${data.amount}`,
            subTitle: formatDateTimeLabel(data.timestamp)
          }))
        : null,
    [bankSnapshotList]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{list ? <MockListView dataList={list} /> : <>loading...</>}</div>;
};

export default BankSnapshotListScene;
