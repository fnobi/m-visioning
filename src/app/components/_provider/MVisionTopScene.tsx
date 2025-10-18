import { Fragment, useState } from "react";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import ErrorScene from "~/app/components/ErrorScene";
import PlanListScene from "~/app/components/PlanListScene";
import { MASTER_MONEY_BANKS, MASTER_MONEY_CARDS } from "~/app/lib/master-data";
import BankTableSceneContainer from "~/app/components/_provider/BankTableSceneContainer";
import { useMoneyPlanList } from "~/app/lib/database/money-plan-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

type TabEntry = { tabId: string; label: string };

const TABS = [
  {
    tabId: "balance-table",
    label: "短期シミュレーション"
  },
  {
    tabId: "plan-list",
    label: "入出金予定一覧"
  }
] as const satisfies TabEntry[];

const MVisionTopScene = () => {
  const { myId } = useAuthorizedUser();
  const [currentTab, setCurrentTab] =
    useState<(typeof TABS)[number]["tabId"]>("balance-table");
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );

  const { moneyPlanList } = useMoneyPlanList({
    userId: myId,
    onError: setStatusError
  });

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!moneyPlanList) {
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
          bankList={MASTER_MONEY_BANKS}
          cardList={MASTER_MONEY_CARDS}
          planList={moneyPlanList}
        />
      ) : null}
      {currentTab === "plan-list" ? (
        <PlanListScene planList={moneyPlanList} />
      ) : null}
    </MockStaticLayout>
  );
};

export default MVisionTopScene;
