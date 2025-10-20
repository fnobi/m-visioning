import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/_provider/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import BankListScene from "~/app/components/BankListScene";

const BankListSceneContainer = () => {
  const { bankAccountList } = useCommonMoneyStore();

  if (!bankAccountList) {
    return <MockLoadingScene />;
  }

  return <BankListScene bankList={bankAccountList} />;
};

const PageBankList = () => (
  <MVisionFrame>
    <BankListSceneContainer />
  </MVisionFrame>
);

export default PageBankList;
