import {
  parseArray,
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type CardSnapshot = {
  cardId: string;
  timestamp: number;
  amount: number;
  detail: {
    label: string;
    price: number;
    date: number;
  }[];
};

export const parseCardSnapshot = (src: unknown) =>
  parseObject<CardSnapshot>(src, ({ cardId, timestamp, amount, detail }) => ({
    cardId: parseString(cardId),
    timestamp: parseNumber(timestamp),
    amount: parseNumber(amount),
    detail: parseArray(detail, d =>
      parseObject<CardSnapshot["detail"][number]>(
        d,
        ({ label, price, date }) => ({
          label: parseString(label),
          price: parseNumber(price),
          date: parseNumber(date)
        })
      )
    )
  }));

export default CardSnapshot;
