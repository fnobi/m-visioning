import {
  parseNumber,
  parseObject,
  parseString
} from "@m-visioning/core/parser-helper";

type MoneyCardAccount = {
  label: string;
  startDay: number;
  paymentDay: number;
  paymentMonthOffset: number;
  bankId: string;
  order: number;
  minAmount: number;
};

export const parseMoneyCardAccount = (src: unknown) =>
  parseObject<MoneyCardAccount>(
    src,
    ({
      label,
      startDay,
      paymentDay,
      paymentMonthOffset,
      bankId,
      order,
      minAmount
    }) => ({
      label: parseString(label),
      startDay: parseNumber(startDay),
      paymentDay: parseNumber(paymentDay),
      paymentMonthOffset: parseNumber(paymentMonthOffset),
      bankId: parseString(bankId),
      order: parseNumber(order),
      minAmount: parseNumber(minAmount)
    })
  );

export default MoneyCardAccount;
