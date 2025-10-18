import {
  parseNumber,
  parseObject,
  parseString
} from "~/common/lib/parser-helper";

type CardSnapshot = {
  cardId: string;
  timestamp: number;
  amount: number;
};

export const parseCardSnapshot = (src: unknown) =>
  parseObject<CardSnapshot>(src, ({ cardId, timestamp, amount }) => ({
    cardId: parseString(cardId),
    timestamp: parseNumber(timestamp),
    amount: parseNumber(amount)
  }));

export default CardSnapshot;
