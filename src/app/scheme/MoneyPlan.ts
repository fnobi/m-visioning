import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type BankMoneyNode = { type: "bank"; bankId: string };
type CardMoneyNode = { type: "card"; cardId: string };
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
  hour: number;
  minute: number;
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

export const parseMoneyPlan = (src: unknown) =>
  parseObject<MoneyPlan>(
    src,
    ({ label, price, from, to, year, month, day, hour, minute }) => ({
      label: parseString(label),
      price: parseNumber(price),
      from: parseFromMoneyNode(from),
      to: parseToMoneyNode(to),
      year: parseNumber(year),
      month: parseNumber(month),
      day: parseNumber(day),
      hour: parseNumber(hour),
      minute: parseNumber(minute)
    })
  );

export default MoneyPlan;
