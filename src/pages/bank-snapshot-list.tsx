import { useCallback, useEffect, useMemo } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import { parseNumber, parseString } from "~/common/lib/parser-helper";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import BankSnapshotListScene from "~/app/components/_provider/BankSnapshotListScene";
import { PAGE_BANK_SNAPSHOT_LIST } from "~/app/lib/page-path";
import useMonthCursor from "~/app/lib/useMonthCursor";

const useBankListSnapshotListPageQuery = () => {
  const { params, setParams } = usePageEntryQuery(PAGE_BANK_SNAPSHOT_LIST);

  const bankId = useMemo(() => params.bank, [params]);
  const monthCode = useMemo(() => parseNumber(params.month), [params]);

  const setBankId = useCallback(
    (bank: string) => setParams({ bank, month: parseString(monthCode) }),
    [monthCode, setParams]
  );
  const setMonthCode = useCallback(
    (v: number) => setParams({ bank: bankId, month: parseString(v) }),
    [bankId, setParams]
  );

  return { bankId, monthCode, setBankId, setMonthCode };
};

const BankListSceneContainer = () => {
  const { bankAccountList } = useCommonMoneyStore();

  const { bankId, monthCode, setBankId, setMonthCode } =
    useBankListSnapshotListPageQuery();

  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode,
    startDay: 1
  });

  useEffect(() => {
    const currentCard = bankAccountList
      ? bankAccountList.find(c => c.id === bankId)
      : null;
    const [defaultCard] = bankAccountList || [];
    if (!currentCard && defaultCard) {
      setBankId(defaultCard.id);
    }
  }, [bankAccountList, bankId, setBankId]);

  if (!bankAccountList || !bankId) {
    return <MockLoadingScene />;
  }

  return (
    <BankSnapshotListScene
      bankId={bankId}
      bankList={bankAccountList}
      monthCursor={monthCursor}
      onChangeBank={setBankId}
    />
  );
};

const PageBankSnapshotList = () => (
  <MVisionFrame>
    <BankListSceneContainer />
  </MVisionFrame>
);

export default PageBankSnapshotList;
