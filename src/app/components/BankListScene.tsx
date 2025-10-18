import { type ComponentPropsWithoutRef, useMemo } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";

const BankListScene = ({
  bankList,
  onDelete
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  onDelete: (id: string) => void;
}) => {
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      bankList.map(({ id, data }) => ({
        key: id,
        title: data.label,
        actions: [
          {
            children: "削除",
            action: {
              type: "button",
              onClick: () => onDelete(id)
            }
          }
        ]
      })),
    [onDelete, bankList]
  );

  return (
    <div>
      <MockListView dataList={list} />
    </div>
  );
};

export default BankListScene;
