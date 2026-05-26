import {
  parseArray,
  parseNumber,
  parseObject,
  parseString
} from "@m-visioning/core/parser-helper";

type CardSnapshot = {
  cardId: string;
  timestamp: number;
  amount: number;
  detail: {
    label: string;
    price: number;
    date: number;
    category: string;
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
        ({ label, price, date, category }) => ({
          label: parseString(label),
          price: parseNumber(price),
          date: parseNumber(date),
          category: parseString(category)
        })
      )
    )
  }));

export default CardSnapshot;
