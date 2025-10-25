import { type ComponentPropsWithoutRef, useMemo, useState } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import { sortBy } from "~/common/lib/array-util";
import MockActionButton from "~/common/components/MockActionButton";
import { calcDateInt } from "~/app/components/BankTableScene";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import { parseMoneyPlan } from "~/app/scheme/MoneyPlan";

const calcPlanSubTitle = (data: MoneyPlan) => {
  if (data.repeat === "year") {
    return `毎年${data.month}月${data.day}日`;
  }
  if (data.repeat === "month") {
    return `毎月${data.day}日`;
  }
  return `${data.year}年${data.month}月${data.day}日`;
};

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
        const cd = new Date();
        const { year, month, day, repeat } = data;
        const td = new Date(year, month - 1, day);
        if (repeat === "year") {
          while (td < cd) {
            td.setFullYear(td.getFullYear() + 1);
          }
        } else if (repeat === "month") {
          while (td < cd) {
            td.setMonth(td.getMonth() + 1);
          }
        }
        return calcDateInt(td);
      }).map(({ id, data }) => ({
        key: id,
        title: `${data.label} / ¥${data.price}`,
        subTitle: calcPlanSubTitle(data),
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
