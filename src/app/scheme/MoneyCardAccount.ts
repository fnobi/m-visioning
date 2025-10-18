import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type MoneyCardAccount = {
  label: string;
  startDay: number;
  bankId: string;
  order: number;
};

export const parseMoneyCardAccount = (src: unknown) =>
  parseObject<MoneyCardAccount>(src, ({ label, startDay, bankId, order }) => ({
    label: parseString(label),
    startDay: parseNumber(startDay),
    bankId: parseString(bankId),
    order: parseNumber(order)
  }));

export default MoneyCardAccount;
