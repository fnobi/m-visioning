import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/_provider/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";

const CardListSceneContainer = () => {
  const { cardAccountList } = useCommonMoneyStore();

  if (!cardAccountList) {
    return <MockLoadingScene />;
  }

  return <CardSnapshotListScene cardList={cardAccountList} />;
};

const PageCardSnapshotList = () => (
  <MVisionFrame>
    <CardListSceneContainer />
  </MVisionFrame>
);

export default PageCardSnapshotList;
