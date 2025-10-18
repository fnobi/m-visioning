import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type BankSnapshot = {
  bankId: string;
  timestamp: number;
  amount: number;
};

export const parseBankSnapshot = (src: unknown) =>
  parseObject<BankSnapshot>(src, ({ bankId, timestamp, amount }) => ({
    bankId: parseString(bankId),
    timestamp: parseNumber(timestamp),
    amount: parseNumber(amount)
  }));

export default BankSnapshot;
