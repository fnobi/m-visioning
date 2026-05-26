import {
  parseArray,
  parseNumber,
  parseObject,
  parseString
} from "@m-visioning/core/parser-helper";

type BankSnapshot = {
  bankId: string;
  timestamp: number;
  amount: number;
  detail: {
    label: string;
    price: number;
    date: number;
  }[];
};

export const parseBankSnapshot = (src: unknown) =>
  parseObject<BankSnapshot>(src, ({ bankId, timestamp, amount, detail }) => ({
    bankId: parseString(bankId),
    timestamp: parseNumber(timestamp),
    amount: parseNumber(amount),
    detail: parseArray(detail, d =>
      parseObject<BankSnapshot["detail"][number]>(
        d,
        ({ label, price, date }) => ({
          label: parseString(label),
          price: parseNumber(price),
          date: parseNumber(date)
        })
      )
    )
  }));

export default BankSnapshot;
