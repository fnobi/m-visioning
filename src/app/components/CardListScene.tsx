import { type ComponentPropsWithoutRef, useMemo } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";

const CardListScene = ({
  cardList
}: {
  cardList: TypedCollectionList<MoneyCardAccount>;
}) => {
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      cardList.map(({ id, data }) => ({
        key: id,
        title: data.label,
        subTitle: `${data.startDay}日開始`
      })),
    [cardList]
  );

  return (
    <div>
      <MockListView dataList={list} />
    </div>
  );
};

export default CardListScene;
