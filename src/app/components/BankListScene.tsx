import { type ComponentPropsWithoutRef, useMemo } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";

const BankListScene = ({
  bankList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
}) => {
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      bankList.map(({ id, data }) => ({
        key: id,
        title: data.label
      })),
    [bankList]
  );

  return (
    <div>
      <MockListView dataList={list} />
    </div>
  );
};

export default BankListScene;
