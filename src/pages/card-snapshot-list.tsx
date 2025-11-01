import { useCallback, useEffect, useMemo } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";
import { PAGE_CARD_SNAPSHOT_LIST } from "~/app/lib/page-path";
import useMonthCursor from "~/app/lib/useMonthCursor";

const useCardListSnapshotListPageQuery = () => {
  const { params, setParams } = usePageEntryQuery(PAGE_CARD_SNAPSHOT_LIST);

  const cardId = useMemo(() => params.card, [params]);
  const monthCode = useMemo(() => parseNumber(params.month), [params]);

  const setCardId = useCallback(
    (v: string) => setParams({ card: v, month: parseString(monthCode) }),
    [monthCode, setParams]
  );

  const setMonthCode = useCallback(
    (v: number) => setParams({ card: cardId, month: parseString(v) }),
    [cardId, setParams]
  );

  return { cardId, monthCode, setCardId, setMonthCode };
};

const CardListSceneContainer = () => {
  const { cardAccountList, bankAccountList, moneyPlanList } =
    useCommonMoneyStore();
  const { cardId, monthCode, setCardId, setMonthCode } =
    useCardListSnapshotListPageQuery();

  const currentCard = useMemo(
    () => (cardAccountList ? cardAccountList.find(c => c.id === cardId) : null),
    [cardAccountList, cardId]
  );

  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode,
    startDay: currentCard ? currentCard.data.startDay : 0
  });

  useEffect(() => {
    const [defaultCard] = cardAccountList || [];
    if (!currentCard && defaultCard) {
      setCardId(defaultCard.id);
    }
  }, [cardAccountList, cardId, currentCard, setCardId]);

  if (!cardAccountList || !bankAccountList || !moneyPlanList || !cardId) {
    return <MockLoadingScene />;
  }

  return (
    <CardSnapshotListScene
      key={[cardId, monthCode].join("-")}
      cardId={cardId}
      cardList={cardAccountList}
      bankList={bankAccountList}
      planList={moneyPlanList}
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
