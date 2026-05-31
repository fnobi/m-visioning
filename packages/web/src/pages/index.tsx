import { useCallback } from "react";
import { parseNumber, parseString } from "@m-visioning/core/util/parser-helper";
import useTypedQuery, { parseBooleanQuery } from "~/common/useTypedQuery";
import BankTableScene, {
  PERIOD_OPTIONS
} from "~/components/_provider/BankTableScene";
import MVisionFrame from "~/components/MVisionFrame";
import useMyMoneyStore from "~/feature/useMyMoneyStore";

const parsePeriodNumberQuery = (src: unknown) => {
  const n = parseNumber(src);
  return PERIOD_OPTIONS.includes(n) ? n : PERIOD_OPTIONS[0];
};

const PageIndex = () => {
  const { bankAccountList } = useMyMoneyStore();
  const parseBankQuery = useCallback(
    (src: unknown) => {
      const options = (bankAccountList || []).map(({ id }) => id);
      const s = parseString(src);
      return (options.includes(s) ? s : options[0]) || "";
    },
    [bankAccountList]
  );
  const { queryValue: bankId, setQueryValue: setBankId } = useTypedQuery(
    "bank",
    parseBankQuery
  );
  const { queryValue: monthCode, setQueryValue: setMonthCode } = useTypedQuery(
    "month",
    parseNumber
  );
  const { queryValue: period, setQueryValue: setPeriod } = useTypedQuery(
    "period",
    parsePeriodNumberQuery
  );
  const { queryValue: graphMode, setQueryValue: setGraph } = useTypedQuery(
    "graph",
    parseBooleanQuery
  );
  return (
    <MVisionFrame>
      <BankTableScene
        bankId={bankId}
        monthCode={monthCode}
        period={period}
        graphMode={graphMode}
        setBankId={setBankId}
        setMonthCode={setMonthCode}
        setPeriod={setPeriod}
        setGraph={setGraph}
      />
    </MVisionFrame>
  );
};

export default PageIndex;
