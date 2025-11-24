import { useCallback } from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

// eslint-disable-next-line import/prefer-default-export
export const usePlanListLabel = ({
  bankList,
  cardList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
}) => {
  const resolveBankLabel = useCallback(
    (bankId: string) => {
      const ent = bankList.find(b => b.id === bankId);
      return ent ? ent.data.label : bankId;
    },
    [bankList]
  );

  const resolveCardLabel = useCallback(
    (cardId: string) => {
      const ent = cardList.find(b => b.id === cardId);
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
