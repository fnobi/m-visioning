type MoneyNode =
  | { type: "bank"; bankId: string }
  | { type: "card"; cardId: string };
type FromMoneyNode = MoneyNode | { type: "input" };
type ToMoneyNode = MoneyNode | { type: "output" };

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
