import { useCallback } from "react";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import useTypedQuery, { parseBooleanQuery } from "~/common/lib/useTypedQuery";
import BankTableSceneContainer, {
  PERIOD_OPTIONS
} from "~/app/components/_provider/BankTableSceneContainer";
import MVisionFrame from "~/app/components/MVisionFrame";
import useMyMoneyStore from "~/app/lib/database/useMyMoneyStore";

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
      <BankTableSceneContainer
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
