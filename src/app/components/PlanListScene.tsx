import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const PlanListScene = ({
  planList
}: {
  planList: TypedCollectionList<MoneyPlan>;
}) => (
  <div>
    {planList.map(({ id, data }) => (
      <p key={id}>
        {data.label}
        <br />
        {[data.year, data.month, data.day].map(v => v || "*").join(" ")}
        <br />
        {data.price}
      </p>
    ))}
  </div>
);

export default PlanListScene;
