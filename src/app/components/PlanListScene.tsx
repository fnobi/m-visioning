import {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState
} from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import { sortBy } from "~/common/lib/array-util";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const PlanListScene = ({
  planList,
  onWrite,
  onDelete
}: {
  planList: TypedCollectionList<MoneyPlan>;
  onWrite: (id: string, data: MoneyPlan) => void;
  onDelete: (id: string) => void;
}) => {
  const [editData, setEditData] = useState<{
    id: string;
    data: MoneyPlan;
  } | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => setNow(Date.now()), []);

  const list = useMemo((): ComponentPropsWithoutRef<
    typeof MockListView
  >["dataList"] => {
    const nowDate = new Date(now);
    return sortBy(planList, ({ data }) => {
      const { year, month, day } = data;
      let nm = nowDate.getMonth() + 1;
      if (day < nowDate.getDate()) {
        nm += 1;
      }
      const m = month || nm;

      let ny = nowDate.getFullYear();
      if (m < nowDate.getMonth() + 1) {
        ny += 1;
      }
      const y = year || ny;

      return y * 10000 + m * 100 + day;
    }).map(({ id, data }) => ({
      key: id,
      title: `${data.label} / ¥${data.price}`,
      subTitle: [data.year, data.month, data.day].map(v => v || "*").join(" "),
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
    }));
  }, [now, onDelete, planList]);

  return (
    <div>
      <MockListView dataList={list} />
      {editData ? (
        <PlanFormPopup
          defaultValue={editData.data}
          onClose={() => setEditData(null)}
          onSubmit={v => {
            onWrite(editData.id, v);
            setEditData(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default PlanListScene;
