import useMyMoneyStore from "~/feature/useMyMoneyStore";
import MockLoadingScene from "~/components/MockLoadingScene";
import MVisionFrame from "~/components/MVisionFrame";
import PlanListScene from "~/components/_provider/PlanListScene";

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
