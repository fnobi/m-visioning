import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type MoneyCardAccount = {
  label: string;
  startDay: number;
  bankId: string;
};

export const parseMoneyCardAccount = (src: unknown) =>
  parseObject<MoneyCardAccount>(src, ({ label, startDay, bankId }) => ({
    label: parseString(label),
    startDay: parseNumber(startDay),
    bankId: parseString(bankId)
  }));

export default MoneyCardAccount;
