import { useCallback } from "react";
import { parseNumber, parseString } from "@m-visioning/core/util/parser-helper";
import useTypedQuery, { parseBooleanQuery } from "~/common/useTypedQuery";
import MVisionFrame from "~/components/MVisionFrame";
import useMyMoneyStore from "~/feature/useMyMoneyStore";
import CardSnapshotListScene from "~/components/_provider/CardSnapshotListScene";

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
  const { queryValue: graphMode, setQueryValue: setGraph } = useTypedQuery(
    "graph",
    parseBooleanQuery
  );
  return (
    <MVisionFrame>
      <CardSnapshotListScene
        key={[cardId, monthCode].join("-")}
        cardId={cardId}
        monthCode={monthCode}
        graphMode={graphMode}
        onChangeMonth={setMonthCode}
        onChangeCard={setCardId}
        setGraph={setGraph}
      />
    </MVisionFrame>
  );
};

export default PageCardSnapshotList;
