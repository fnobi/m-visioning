import MockLoadingScene from "~/common/components/MockLoadingScene";
import MVisionFrame from "~/app/components/MVisionFrame";
import useCommonMoneyStore from "~/app/lib/database/useCommonMoneyStore";
import BankSnapshotListScene from "~/app/components/_provider/BankSnapshotListScene";

const BankListSceneContainer = () => {
  const { bankAccountList } = useCommonMoneyStore();

  if (!bankAccountList) {
    return <MockLoadingScene />;
  }

  return <BankSnapshotListScene bankList={bankAccountList} />;
};

const PageBankSnapshotList = () => (
  <MVisionFrame>
    <BankListSceneContainer />
  </MVisionFrame>
);

export default PageBankSnapshotList;
