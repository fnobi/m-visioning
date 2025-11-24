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
import { useMyPagePropertyTools } from "~/app/lib/database/my-page-property-database";
import type MyPageProperty from "~/app/scheme/MyPageProperty";
import { calcDateInt } from "~/app/components/BankTableScene";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import {
  type FromMoneyNode,
  parseMoneyPlan,
  type ToMoneyNode
} from "~/app/scheme/MoneyPlan";

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

  const [editData, setEditData] = useState<{
    id: string;
    data: MoneyPlan;
  } | null>(null);

  const resolveBankLabel = useCallback(
    (bankId: string) => {
      const ent = bankList.find(b => b.id === bankId);
      return ent ? ent.data.label : bankId;
    },
    [bankList]
  );

  const resolveCardLabel = useCallback(
    (cardId: string) => {
      const ent = cardList.find(b => b.id === cardId);
      return ent ? ent.data.label : cardId;
    },
    [cardList]
  );

  const calcPlanDateLabel = useCallback((data: MoneyPlan) => {
    if (data.repeat === "year") {
      return `毎年${data.month}月${data.day}日`;
    }
    if (data.repeat === "month") {
      return `毎月${data.day}日`;
    }
    return `${data.year}年${data.month}月${data.day}日`;
  }, []);

  const calcMoneyNodeLabel = useCallback(
    (n: ToMoneyNode | FromMoneyNode) => {
      if (n.type === "bank") {
        return `銀行:${resolveBankLabel(n.bankId)}`;
      }
      if (n.type === "card") {
        return `カード:${resolveCardLabel(n.cardId)}`;
      }
      return "?";
    },
    [resolveBankLabel, resolveCardLabel]
  );

  const calcPlanFlowLabel = useCallback(
    ({ from, to }: MoneyPlan) => {
      if (to.type === "output") {
        return `[支出] ${calcMoneyNodeLabel(from)}`;
      }
      if (from.type === "input") {
        return `[収入] ${calcMoneyNodeLabel(to)}`;
      }
      return `[転送] ${calcMoneyNodeLabel(from)} > ${calcMoneyNodeLabel(to)}`;
    },
    [calcMoneyNodeLabel]
  );

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
        title: `${data.label} / ¥${data.price}`,
        subTitle: [calcPlanDateLabel(data), calcPlanFlowLabel(data)].join("\n"),
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
      calcPlanDateLabel,
      calcPlanFlowLabel,
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
