import { type ComponentPropsWithoutRef, useMemo } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockListView from "~/common/components/MockListView";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const PlanListScene = ({
  planList
}: {
  planList: TypedCollectionList<MoneyPlan>;
}) => {
  const list = useMemo(
    (): ComponentPropsWithoutRef<typeof MockListView>["dataList"] =>
      planList.map(({ id, data }) => ({
        key: id,
        title: `${data.label} / ¥${data.price}`,
        subTitle: [data.year, data.month, data.day].map(v => v || "*").join(" ")
      })),
    [planList]
  );

  return (
    <div>
      <MockListView dataList={list} />
    </div>
  );
};

export default PlanListScene;
