import { parseObject, parseString } from "~/common/lib/parser-helper";

type MoneyBankAccount = {
  label: string;
};

export const parseMoneyBankAccount = (src: unknown) =>
  parseObject<MoneyBankAccount>(src, ({ label }) => ({
    label: parseString(label)
  }));

export default MoneyBankAccount;
