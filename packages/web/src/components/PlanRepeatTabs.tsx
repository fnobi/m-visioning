import styled from "@emotion/styled";
import { em } from "~/common/css-util";
import { THEME_COLOR } from "~/feature/emotion-mixin";
import {
  PLAN_REPEAT_TABS,
  type PlanRepeatTabValue
} from "~/feature/plan-util";
import MockActionButton from "~/components/MockActionButton";

const TabList = styled.ul({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  flexWrap: "wrap",
  gap: em(0.8),
  marginBottom: em(0.5)
});

const TabItem = styled.li<{ active: boolean }>(({ active }) => ({
  fontWeight: active ? "bold" : "normal",
  borderBottom: `solid 2px ${active ? THEME_COLOR.DARK : "transparent"}`
}));

const PlanRepeatTabs = ({
  value,
  onChange
}: {
  value: PlanRepeatTabValue;
  onChange: (v: PlanRepeatTabValue) => void;
}) => (
  <TabList>
    {PLAN_REPEAT_TABS.map(({ value: tabValue, label }) => (
      <TabItem key={tabValue} active={tabValue === value}>
        {tabValue === value ? (
          label
        ) : (
          <MockActionButton
            action={{ type: "button", onClick: () => onChange(tabValue) }}
          >
            {label}
          </MockActionButton>
        )}
      </TabItem>
    ))}
  </TabList>
);

export default PlanRepeatTabs;
