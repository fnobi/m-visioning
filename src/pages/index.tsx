import { Fragment, useState } from "react";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockActionButton from "~/common/components/MockActionButton";
import BalanceTableScene from "~/app/components/BalanceTableScene";
import PlanListScene from "~/app/components/PlanListScene";
import {
  MASTER_BANK_SNAPSHOT,
  MASTER_CARD_SNAPSHOT,
  MASTER_MONEY_BANKS,
  MASTER_MONEY_CARDS,
  MASTER_PLANS
} from "~/app/lib/master-data";

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

const PageIndex = () => {
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
        <BalanceTableScene
          bankList={MASTER_MONEY_BANKS}
          cardList={MASTER_MONEY_CARDS}
          planList={MASTER_PLANS}
          bankSnapshotList={MASTER_BANK_SNAPSHOT}
          cardSnapshotList={MASTER_CARD_SNAPSHOT}
        />
      ) : null}
      {currentTab === "plan-list" ? (
        <PlanListScene planList={MASTER_PLANS} />
      ) : null}
    </MockStaticLayout>
  );
};

export default PageIndex;
