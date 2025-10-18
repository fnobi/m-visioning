import { Fragment, useState } from "react";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import BankSnapshotListScene from "~/app/components/_provider/BankSnapshotListScene";
import CardSnapshotListScene from "~/app/components/_provider/CardSnapshotListScene";
import CardListScene from "~/app/components/CardListScene";
import ErrorScene from "~/app/components/ErrorScene";
import PlanListScene from "~/app/components/PlanListScene";
import BankTableSceneContainer from "~/app/components/_provider/BankTableSceneContainer";
import { useMoneyPlanList } from "~/app/lib/database/money-plan-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import BankListScene from "~/app/components/BankListScene";
import { useBankAccountList } from "~/app/lib/database/bank-account-database";
import { useCardAccountList } from "~/app/lib/database/card-account-database";

type TabEntry = { tabId: string; label: string };

const TABS = [
  {
    tabId: "balance-table",
    label: "短期シミュレーション"
  },
  {
    tabId: "plan-list",
    label: "入出金予定一覧"
  },
  {
    tabId: "bank-list",
    label: "銀行口座一覧"
  },
  {
    tabId: "card-list",
    label: "カード一覧"
  },
  {
    tabId: "bank-snapshot-list",
    label: "口座ログ一覧"
  },
  {
    tabId: "card-snapshot-list",
    label: "カードログ一覧"
  }
] as const satisfies TabEntry[];

const MVisionTopScene = () => {
  const { myId } = useAuthorizedUser();
  const [currentTab, setCurrentTab] =
    useState<(typeof TABS)[number]["tabId"]>("balance-table");
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );

  const { moneyPlanList, deleteMoneyPlan } = useMoneyPlanList({
    userId: myId,
    onError: setStatusError
  });
  const { bankAccountList } = useBankAccountList({
    userId: myId,
    onError: setStatusError
  });
  const { cardAccountList } = useCardAccountList({
    userId: myId,
    onError: setStatusError
  });

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!moneyPlanList || !bankAccountList || !cardAccountList) {
    return <MockLoadingScene />;
  }

  return (
    <MockStaticLayout>
      <p>
        {TABS.map(({ tabId, label }) => (
          <Fragment key={tabId}>
            <MockActionButton
              action={
                currentTab === tabId
                  ? null
                  : { type: "button", onClick: () => setCurrentTab(tabId) }
              }
            >
              {label}
            </MockActionButton>
            &nbsp;
          </Fragment>
        ))}
      </p>
      {currentTab === "balance-table" ? (
        <BankTableSceneContainer
          bankList={bankAccountList}
          cardList={cardAccountList}
          planList={moneyPlanList}
        />
      ) : null}
      {currentTab === "plan-list" ? (
        <PlanListScene planList={moneyPlanList} onDelete={deleteMoneyPlan} />
      ) : null}
      {currentTab === "bank-list" ? (
        <BankListScene bankList={bankAccountList} />
      ) : null}
      {currentTab === "card-list" ? (
        <CardListScene cardList={cardAccountList} />
      ) : null}
      {currentTab === "bank-snapshot-list" ? <BankSnapshotListScene /> : null}
      {currentTab === "card-snapshot-list" ? (
        <CardSnapshotListScene cardList={cardAccountList} />
      ) : null}
    </MockStaticLayout>
  );
};

export default MVisionTopScene;
