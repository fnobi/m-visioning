import {
  parseNumber,
  parseObject,
  parseString
} from "@m-visioning/core/parser-helper";

export type BankMoneyNode = { type: "bank"; bankId: string };
export type CardMoneyNode = { type: "card"; cardId: string };
type MoneyNode = BankMoneyNode | CardMoneyNode;
export type FromMoneyNode = MoneyNode | { type: "input" };
export type ToMoneyNode = MoneyNode | { type: "output" };

type MoneyPlan = {
  label: string;
  price: number;
  from: FromMoneyNode;
  to: ToMoneyNode;
  year: number;
  month: number;
  day: number;
  repeat: "year" | "month" | "week" | null;
  category: string;
};

const parseMoneyNode = (src: unknown) =>
  parseObject<MoneyNode>(src, ({ type }) => {
    if (type === "bank") {
      return parseObject<BankMoneyNode>(src, ({ bankId }) => ({
        type: "bank",
        bankId: parseString(bankId)
      }));
    }
    return parseObject<CardMoneyNode>(src, ({ cardId }) => ({
      type: "card",
      cardId: parseString(cardId)
    }));
  });

const parseFromMoneyNode = (src: unknown) =>
  parseObject<FromMoneyNode>(src, ({ type }) => {
    if (type === "input") {
      return { type: "input" };
    }
    return parseMoneyNode(src);
  });

const parseToMoneyNode = (src: unknown) =>
  parseObject<ToMoneyNode>(src, ({ type }) => {
    if (type === "output") {
      return { type: "output" };
    }
    return parseMoneyNode(src);
  });

export const parseMoneyPlanRepeat = (src: unknown): MoneyPlan["repeat"] => {
  switch (src) {
    case "year":
    case "month":
    case "week":
      return src;
    default:
      return null;
  }
};

const normalizePlanFlow = (
  value: Pick<MoneyPlan, "from" | "to">
): Pick<MoneyPlan, "from" | "to"> => {
  if (value.from.type === "bank" && value.to.type === "bank") {
    return { ...value };
  }
  if (value.from.type === "input") {
    return {
      from: { type: "input" },
      to: {
        type: "bank",
        bankId: value.to.type === "bank" ? value.to.bankId : ""
      }
    };
  }
  return {
    from: { ...value.from },
    to: { type: "output" }
  };
};

export const parseMoneyPlan = (src: unknown) =>
  parseObject<MoneyPlan>(
    src,
    ({ label, price, from, to, year, month, day, repeat, category }) => ({
      label: parseString(label),
      price: parseNumber(price),
      ...normalizePlanFlow({
        from: parseFromMoneyNode(from),
        to: parseToMoneyNode(to)
      }),
      year: parseNumber(year),
      month: parseNumber(month),
      day: parseNumber(day),
      repeat: parseMoneyPlanRepeat(repeat),
      category: parseString(category)
    })
  );

export default MoneyPlan;
