import { Fragment, useState } from "react";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import PlanListScene from "~/app/components/PlanListScene";
import {
  MASTER_MONEY_BANKS,
  MASTER_MONEY_CARDS,
  MASTER_PLANS
} from "~/app/lib/master-data";
import BankTableSceneContainer from "~/app/components/_provider/BankTableSceneContainer";

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
  const [currentTab, setCurrentTab] =
    useState<(typeof TABS)[number]["tabId"]>("balance-table");
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
          planList={MASTER_PLANS}
        />
      ) : null}
      {currentTab === "plan-list" ? (
        <PlanListScene planList={MASTER_PLANS} />
      ) : null}
    </MockStaticLayout>
  );
};

export default MVisionTopScene;
