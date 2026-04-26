import {
  type ComponentPropsWithoutRef,
  useCallback,
  useMemo,
  useState
} from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import { sortBy } from "~/common/lib/array-util";
import MockActionButton from "~/common/components/MockActionButton";
import { useMyPagePropertyTools } from "~/app/core/database/my-page-property-database";
import type MyPageProperty from "~/app/scheme/MyPageProperty";
import { calcDateInt } from "~/app/ui/_provider/BankTableScene";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import PlanFormPopup from "~/app/ui/PlanFormPopup";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import { parseMoneyPlan } from "~/app/scheme/MoneyPlan";
import { usePlanListLabel } from "~/app/core/plan-util";

const PlanListScene = ({
  planList,
  bankList,
  cardList,
  myPageProperty,
  onWrite,
  onCreate,
  onDelete
}: {
  planList: TypedCollectionList<MoneyPlan>;
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
  myPageProperty: MyPageProperty;
  onWrite: (id: string, data: MoneyPlan) => void;
  onCreate: (data: MoneyPlan) => void;
  onDelete: (id: string) => void;
}) => {
  const { writeMyPageProperty } = useMyPagePropertyTools();
  const { calcPlanTitle, calcPlanSubTitle } = usePlanListLabel({
    bankList,
    cardList
  });

  const [editData, setEditData] = useState<{
    id: string;
    data: MoneyPlan;
  } | null>(null);

  const toggleFav = useCallback(
    (v: string[]) => writeMyPageProperty({ favPlanList: v }),
    [writeMyPageProperty]
  );

  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView<string>>["dataList"] =>
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
        fav: { checked: myPageProperty.favPlanList.includes(id) },
        title: calcPlanTitle(data),
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
    [
      calcPlanSubTitle,
      calcPlanTitle,
      myPageProperty.favPlanList,
      onDelete,
      planList
    ]
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
      <MockListView
        dataList={list}
        fav={{ value: myPageProperty.favPlanList, onChange: toggleFav }}
      />
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
