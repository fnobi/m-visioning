import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/MVisionFrame";
import PlanListScene from "~/app/components/_provider/PlanListScene";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";

const PlanListSceneContainer = () => {
  const { moneyPlanList, bankAccountList, cardAccountList, myPageProperty } =
    useCommonMoneyStore();
  const { writeMoneyPlan, createMoneyPlan, deleteMoneyPlan } =
    useMyMoneyPlanTools();

  if (
    !moneyPlanList ||
    !bankAccountList ||
    !cardAccountList ||
    !myPageProperty
  ) {
    return <MockLoadingScene />;
  }

  return (
    <PlanListScene
      planList={moneyPlanList}
      bankList={bankAccountList}
      cardList={cardAccountList}
      myPageProperty={myPageProperty}
      onWrite={writeMoneyPlan}
      onCreate={createMoneyPlan}
      onDelete={deleteMoneyPlan}
    />
  );
};

const PagePlanList = () => (
  <MVisionFrame>
    <PlanListSceneContainer />
  </MVisionFrame>
);

export default PagePlanList;
