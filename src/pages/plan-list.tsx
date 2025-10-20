import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/_provider/MVisionFrame";
import PlanListScene from "~/app/components/PlanListScene";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";

const PlanListSceneContainer = () => {
  const { moneyPlanList, bankAccountList, cardAccountList } =
    useCommonMoneyStore();
  const { writeMoneyPlan, createMoneyPlan, deleteMoneyPlan } =
    useMyMoneyPlanTools();

  if (!moneyPlanList || !bankAccountList || !cardAccountList) {
    return <MockLoadingScene />;
  }

  return (
    <PlanListScene
      planList={moneyPlanList}
      bankList={bankAccountList}
      cardList={cardAccountList}
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
