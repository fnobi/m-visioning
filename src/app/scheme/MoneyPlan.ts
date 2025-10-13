type MoneyNode =
  | { type: "bank"; bankId: string }
  | { type: "card"; cardId: string };
export type FromMoneyNode = MoneyNode | { type: "input" };
export type ToMoneyNode = MoneyNode | { type: "output" };

type MoneyPlan = {
  label: string;
  price: number;
  from: FromMoneyNode;
  to: ToMoneyNode;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export default MoneyPlan;
