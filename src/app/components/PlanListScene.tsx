import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import { sortBy } from "~/common/lib/array-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import { parseMoneyPlan } from "~/app/scheme/MoneyPlan";

const PlanListScene = ({
  planList,
  bankList,
  cardList,
  onWrite,
  onCreate,
  onDelete
}: {
  planList: TypedCollectionList<MoneyPlan>;
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
  onWrite: (id: string, data: MoneyPlan) => void;
  onCreate: (data: MoneyPlan) => void;
  onDelete: (id: string) => void;
}) => {
  const [editData, setEditData] = useState<{
    id: string;
    data: MoneyPlan;
  } | null>(null);

  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      sortBy(planList, ({ data }) => {
        const { year, month, day } = data;
        return (year * 100 + month) * 100 + day;
      }).map(({ id, data }) => ({
        key: id,
        title: `${data.label} / ¥${data.price}`,
        subTitle: `${data.year}年${data.month}月${data.day}日${
          data.repeat ? `〜 [${data.repeat}ly]` : ""
        }`,
        mainAction: {
          type: "button",
          onClick: () => setEditData({ id, data })
        },
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
    [onDelete, planList]
  );

  return (
    <>
      <p>
        <MockActionButton
          action={{
            type: "button",
            onClick: () =>
              setEditData({
                id: "",
                data: parseMoneyPlan(null)
              })
          }}
        >
          新規作成
        </MockActionButton>
      </p>
      <MockListView dataList={list} />
      {editData ? (
        <PlanFormPopup
          defaultValue={editData.data}
          bankList={bankList}
          cardList={cardList}
          onClose={() => setEditData(null)}
          onSubmit={v => {
            if (editData.id) {
              onWrite(editData.id, v);
            } else {
              onCreate(v);
            }
            setEditData(null);
          }}
        />
      ) : null}
    </>
  );
};

export default PlanListScene;
