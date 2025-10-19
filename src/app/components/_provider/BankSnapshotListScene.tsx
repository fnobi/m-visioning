import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useState
} from "react";
import MockListView from "~/common/components/MockListView";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { formatDateTimeLabel } from "~/common/lib/date-util";
import BankSnapshotFormPopup from "~/app/components/BankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const BankSnapshotListScene = () => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const { bankSnapshotList, writeBankSnapshot, deleteBankSnapshot } =
    useBankSnapshotList({
      userId: myId,
      onError: setStatusError
    });
  const [editData, setEditData] = useState<{
    id: string;
    data: BankSnapshot;
  } | null>(null);

  // TODO: async handler噛ませて欲しい
  const handleSubmit = useCallback(
    async (id: string, v: BankSnapshot) => {
      await writeBankSnapshot(id, v);
      setEditData(null);
    },
    [writeBankSnapshot]
  );

  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] | null =>
      bankSnapshotList
        ? bankSnapshotList.map(({ id, data }) => ({
            key: id,
            title: `${data.bankId} / ¥${data.amount}`,
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
                  onClick: () => deleteBankSnapshot(id)
                }
              }
            ]
          }))
        : null,
    [bankSnapshotList, deleteBankSnapshot]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return (
    <>
      <div>{list ? <MockListView dataList={list} /> : <>loading...</>}</div>
      {editData ? (
        <BankSnapshotFormPopup
          defaultValue={editData.data}
          onSubmit={v => handleSubmit(editData.id, v)}
          onClose={() => setEditData(null)}
        />
      ) : null}
    </>
  );
};

export default BankSnapshotListScene;
