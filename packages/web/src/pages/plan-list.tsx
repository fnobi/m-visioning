import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/MVisionFrame";
import PlanListScene from "~/app/components/_provider/PlanListScene";
import useMyMoneyStore from "~/app/lib/database/useMyMoneyStore";

const PlanListSceneContainer = () => {
  const {
    moneyPlanList,
    bankAccountList,
    cardAccountList,
    myPageProperty,
    writeMoneyPlan,
    createMoneyPlan,
    deleteMoneyPlan
  } = useMyMoneyStore();

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
