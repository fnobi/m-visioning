import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/_provider/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardListScene from "~/app/components/CardListScene";

const CardListSceneContainer = () => {
  const { cardAccountList } = useCommonMoneyStore();

  if (!cardAccountList) {
    return <MockLoadingScene />;
  }

  return <CardListScene cardList={cardAccountList} />;
};

const PageCardList = () => (
  <MVisionFrame>
    <CardListSceneContainer />
  </MVisionFrame>
);

export default PageCardList;
