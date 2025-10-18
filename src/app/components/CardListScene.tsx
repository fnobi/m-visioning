import { type ComponentPropsWithoutRef, useMemo } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";

const CardListScene = ({
  cardList,
  onDelete
}: {
  cardList: TypedCollectionList<MoneyCardAccount>;
  onDelete: (id: string) => void;
}) => {
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      cardList.map(({ id, data }) => ({
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
    [onDelete, cardList]
  );

  return (
    <div>
      <MockListView dataList={list} />
    </div>
  );
};

export default CardListScene;
