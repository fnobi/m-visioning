import { useCallback } from "react";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import type MoneyCardAccount from "@m-visioning/core/scheme/MoneyCardAccount";
import {
  type FromMoneyNode,
  type ToMoneyNode
} from "@m-visioning/core/scheme/MoneyPlan";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// eslint-disable-next-line import/prefer-default-export
export const usePlanListLabel = ({
  bankList,
  cardList
}: {
  bankList: TypedCollectionList<MoneyBankAccount> | null;
  cardList: TypedCollectionList<MoneyCardAccount> | null;
}) => {
  const resolveBankLabel = useCallback(
    (bankId: string) => {
      const ent = (bankList || []).find(b => b.id === bankId);
      return ent ? ent.data.label : bankId;
    },
    [bankList]
  );

  const resolveCardLabel = useCallback(
    (cardId: string) => {
      const ent = (cardList || []).find(b => b.id === cardId);
      return ent ? ent.data.label : cardId;
    },
    [cardList]
  );

  const calcPlanDateLabel = useCallback((data: MoneyPlan) => {
    if (data.repeat === "year") {
      return `毎年${data.month}月${data.day}日`;
    }
    if (data.repeat === "month") {
      return `毎月${data.day}日`;
    }
    if (data.repeat === "week") {
      const weekday =
        WEEKDAY_LABELS[new Date(data.year, data.month - 1, data.day).getDay()];
      return `毎週${weekday}曜日`;
    }
    return `${data.year}年${data.month}月${data.day}日`;
  }, []);

  const calcMoneyNodeLabel = useCallback(
    (n: ToMoneyNode | FromMoneyNode) => {
      if (n.type === "bank") {
        return `銀行:${resolveBankLabel(n.bankId)}`;
      }
      if (n.type === "card") {
        return `カード:${resolveCardLabel(n.cardId)}`;
      }
      return "?";
    },
    [resolveBankLabel, resolveCardLabel]
  );

  const calcPlanFlowLabel = useCallback(
    ({ from, to }: MoneyPlan) => {
      if (to.type === "output") {
        return `[支出] ${calcMoneyNodeLabel(from)}`;
      }
      if (from.type === "input") {
        return `[収入] ${calcMoneyNodeLabel(to)}`;
      }
      return `[転送] ${calcMoneyNodeLabel(from)} > ${calcMoneyNodeLabel(to)}`;
    },
    [calcMoneyNodeLabel]
  );

  const calcPlanTitle = useCallback(
    (data: MoneyPlan) => `${data.label} / ¥${data.price}`,
    []
  );

  const calcPlanSubTitle = useCallback(
    (data: MoneyPlan) =>
      [calcPlanDateLabel(data), calcPlanFlowLabel(data)].join("\n"),
    [calcPlanDateLabel, calcPlanFlowLabel]
  );

  return {
    calcPlanTitle,
    calcPlanSubTitle
  };
};
