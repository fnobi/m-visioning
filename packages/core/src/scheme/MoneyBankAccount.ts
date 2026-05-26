import {
  parseNumber,
  parseObject,
  parseString
} from "@m-visioning/core/parser-helper";

type MoneyBankAccount = {
  label: string;
  order: number;
};

export const parseMoneyBankAccount = (src: unknown) =>
  parseObject<MoneyBankAccount>(src, ({ label, order }) => ({
    label: parseString(label),
    order: parseNumber(order)
  }));

export default MoneyBankAccount;
