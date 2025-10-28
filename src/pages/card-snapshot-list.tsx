import { useCallback, useEffect, useMemo, useState } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";
import { PAGE_CARD_SNAPSHOT_LIST } from "~/app/lib/page-path";
import useMonthCursor from "~/app/lib/useMonthCursor";

const useCardListSnapshotListPageQuery = () => {
  const { params, mergeParams } = usePageEntryQuery(PAGE_CARD_SNAPSHOT_LIST);

  const cardId = useMemo(() => params.card, [params]);

  const setCardId = useCallback(
    (v: string) => mergeParams({ card: v }),
    [mergeParams]
  );

  return { cardId, setCardId };
};

const CardListSceneContainer = () => {
  const { cardAccountList } = useCommonMoneyStore();
  const { cardId, setCardId } = useCardListSnapshotListPageQuery();
  const [monthCode, setMonthCode] = useState(0);

  const currentCard = useMemo(
    () => (cardAccountList ? cardAccountList.find(c => c.id === cardId) : null),
    [cardAccountList, cardId]
  );

  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode,
    startDay: currentCard ? currentCard.data.startDay : 1
  });

  useEffect(() => {
    const [defaultCard] = cardAccountList || [];
    if (!currentCard && defaultCard) {
      setCardId(defaultCard.id);
    }
  }, [cardAccountList, cardId, currentCard, setCardId]);

  if (!cardAccountList || !cardId) {
    return <MockLoadingScene />;
  }

  return (
    <CardSnapshotListScene
      cardId={cardId}
      cardList={cardAccountList}
      monthCursor={monthCursor}
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
