import { useCallback, useEffect, useMemo } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import usePageEntryQuery from "~/common/lib/usePageEntryQuery";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import BankSnapshotListScene from "~/app/components/_provider/BankSnapshotListScene";
import { PAGE_BANK_SNAPSHOT_LIST } from "~/app/lib/page-path";

const useBankListSnapshotListPageQuery = () => {
  const { params, mergeParams } = usePageEntryQuery(PAGE_BANK_SNAPSHOT_LIST);

  const bankId = useMemo(() => params.bank, [params]);

  const setBankId = useCallback(
    (id: string) => mergeParams({ bank: id }),
    [mergeParams]
  );

  return { bankId, setBankId };
};

const BankListSceneContainer = () => {
  const { bankAccountList } = useCommonMoneyStore();

  const { bankId, setBankId } = useBankListSnapshotListPageQuery();

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
