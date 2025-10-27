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
import BankSnapshotFormPopup from "~/app/components/BankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";

const BankSnapshotListScene = ({
  bankId,
  bankList,
  onChangeBank
}: {
  bankId: string;
  bankList: TypedCollectionList<MoneyBankAccount>;
  onChangeBank: (id: string) => void;
}) => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const { bankSnapshotList, writeBankSnapshot, deleteBankSnapshot } =
    useBankSnapshotList({
      userId: myId,
      bankId,
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
      <div>
        <select value={bankId} onChange={e => onChangeBank(e.target.value)}>
          {bankList.map(({ id, data }) => (
            <option key={id} value={id}>
              {data.label}
            </option>
          ))}
        </select>
      </div>
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
