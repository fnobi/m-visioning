import { useCallback } from "react";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import useTypedQuery from "~/common/lib/useTypedQuery";
import MVisionFrame from "~/app/components/MVisionFrame";
import useMyMoneyStore from "~/app/lib/database/useMyMoneyStore";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";

const PageCardSnapshotList = () => {
  const { cardAccountList } = useMyMoneyStore();
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
  return (
    <MVisionFrame>
      <CardSnapshotListScene
        key={[cardId, monthCode].join("-")}
        cardId={cardId}
        monthCode={monthCode}
        onChangeMonth={setMonthCode}
        onChangeCard={setCardId}
      />
    </MVisionFrame>
  );
};

export default PageCardSnapshotList;
