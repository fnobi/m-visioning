import { useCallback, useEffect, useMemo } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import useTypedQuery from "~/common/lib/useTypedQuery";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";
import useMonthCursor from "~/app/lib/useMonthCursor";

const CardListSceneContainer = () => {
  const { cardAccountList, bankAccountList, moneyPlanList } =
    useCommonMoneyStore();
  const parseCardQuery = useCallback(
    (src: unknown) => {
      const options = (cardAccountList || []).map(({ id }) => id);
      const s = parseString(src);
      return (options.includes(s) ? s : options[0]) || "";
    },
    [cardAccountList]
  );
  const { queryValue: cardId, setQueryValue: setCardId } = useTypedQuery(
    "card",
    parseCardQuery
  );
  const { queryValue: monthCode, setQueryValue: setMonthCode } = useTypedQuery(
    "month",
    parseNumber
  );

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
