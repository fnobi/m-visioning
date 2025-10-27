import { useCallback, useEffect, useMemo } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";
import { PAGE_CARD_SNAPSHOT_LIST } from "~/app/lib/page-path";

const useCardListSnapshotListPageQuery = () => {
  const { params, mergeParams } = usePageEntryQuery(PAGE_CARD_SNAPSHOT_LIST);

  const cardId = useMemo(() => params.card, [params]);

  const setCardId = useCallback(
    (id: string) => mergeParams({ card: id }),
    [mergeParams]
  );

  return { cardId, setCardId };
};

const CardListSceneContainer = () => {
  const { cardAccountList } = useCommonMoneyStore();

  const { cardId, setCardId } = useCardListSnapshotListPageQuery();

  useEffect(() => {
    const currentCard = cardAccountList
      ? cardAccountList.find(c => c.id === cardId)
      : null;
    const [defaultCard] = cardAccountList || [];
    if (!currentCard && defaultCard) {
      setCardId(defaultCard.id);
    }
  }, [cardAccountList, cardId, setCardId]);

  if (!cardAccountList || !cardId) {
    return <MockLoadingScene />;
  }

  return (
    <CardSnapshotListScene
      cardId={cardId}
      cardList={cardAccountList}
      onChangeCard={setCardId}
    />
  );
};

const PageCardSnapshotList = () => (
  <MVisionFrame>
    <CardListSceneContainer />
  </MVisionFrame>
);

export default PageCardSnapshotList;
