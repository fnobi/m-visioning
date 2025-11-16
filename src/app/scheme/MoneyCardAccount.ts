import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type MoneyCardAccount = {
  label: string;
  startDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  bankId: string;
  order: number;
};

export const parseMoneyCardAccount = (src: unknown) =>
  parseObject<MoneyCardAccount>(
    src,
    ({ label, startDay, paymentDay, paymentMonthOffset, bankId, order }) => ({
      label: parseString(label),
      startDay: parseNumber(startDay),
      paymentDay: parseNumber(paymentDay),
      paymentMonthOffset: parseNumber(paymentMonthOffset),
      bankId: parseString(bankId),
      order: parseNumber(order)
    })
  );

export default MoneyCardAccount;
