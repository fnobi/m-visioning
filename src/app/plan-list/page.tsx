import { Suspense } from "react";
import PagePlanListClient from "~/app/plan-list/PagePlanListClient";

const PagePlanList = () => (
  <Suspense>
    <PagePlanListClient />
  </Suspense>
);

export default PagePlanList;
