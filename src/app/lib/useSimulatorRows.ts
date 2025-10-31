import { useCallback } from "react";
import { compact, makeArray } from "~/common/lib/array-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type ToMoneyNode, type FromMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import { parseBankSnapshot } from "~/app/scheme/BankSnapshot";

export type SimulatorRow = {
  id: string;
  date: number;
  label: string;
  amount: number;
  price: number;
  isArchive: boolean;
  action:
    | { type: "plan"; planId: string }
    | {
        type: "snapshot";
        snapshotId: string;
      }
    | {
        type: "card-table";
        cardId: string;
        monthCode: number;
      }
    | null;
};

export type CardTerm = {
  cardId: string;
  year: number;
  month: number;
  day: number;
  label: string;
  termStart: number;
  termEnd: number;
  snapshotList: TypedCollectionList<CardSnapshot>;
};

export const calcDayArray = (st: number, length: number) =>
  makeArray(length).map((z, i) => {
    const date = st + 1000 * 60 * 60 * 24 * i;
    const d = new Date(date);
    return {
      date,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    };
  });

export const calcRangeDayArray = (st: number, end: number) =>
  calcDayArray(st, Math.floor((end - st) / (1000 * 60 * 60 * 24)));

const calcMonthCode = (d: { year: number; month: number }) =>
  d.year * 100 + d.month;

export const calcDateParamInt = (d: {
  year: number;
  month: number;
  day: number;
}) => calcMonthCode(d) * 100 + d.day;

const calcCardStartMonthCode = ({
  year,
  month,
  day
}: {
  year: number;
  month: number;
  day: number;
}) => {
  const d = new Date(year, month - 1, day);
  d.setMonth(d.getMonth() - 2);
  return calcMonthCode({ year: d.getFullYear(), month: d.getMonth() + 1 });
};

export const matchMoneyNode = (
  n1: FromMoneyNode | ToMoneyNode,
  n2: FromMoneyNode | ToMoneyNode
) => {
  if (n1.type === "bank") {
    return n2.type === "bank" && n1.bankId === n2.bankId;
  }
  if (n1.type === "card") {
    return n2.type === "card" && n1.cardId === n2.cardId;
  }
  if (n1.type === "input") {
    return n2.type === "input";
  }
  if (n1.type === "output") {
    return n2.type === "output";
  }
  return false;
};

const checkIsAfter = (
  b: { year: number; month: number; day: number },
  a: { year: number; month: number; day: number }
) => calcDateParamInt(b) <= calcDateParamInt(a);

const useSimulatorRows = ({
  planList
}: {
  planList: TypedCollectionList<MoneyPlan>;
}) => {
  const calcRows = useCallback(
    ({
      termStart,
      termEnd,
      baseSnapshot,
      snapshotList,
      nodeFilter,
      sourcePlanList
    }: {
      termStart: number;
      termEnd: number;
      baseSnapshot?: {
        amount: number;
        timestamp: number;
      };
      snapshotList: TypedCollectionList<BankSnapshot | CardSnapshot>;
      // TODO: cardId/bankIdで絞り込み済みのplanListを渡すようにして、1個にまとめたい
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<
        MoneyPlan & { cardSummary: string | null }
      >;
    }) => {
      const sourcePlanList2 = compact(
        sourcePlanList.map(pair => {
          const { id, data } = pair;
          const { from, to } = data;
          if (matchMoneyNode(to, nodeFilter)) {
            return { id, data };
          }
          if (matchMoneyNode(from, nodeFilter)) {
            return { id, data: { ...data, price: -data.price } };
          }
          return null;
        })
      );

      let amount = baseSnapshot?.amount ?? 0;
      let minDate = baseSnapshot?.timestamp ?? termStart;
      const rows = [...snapshotList]
        .reverse()
        .map(({ id, data }) => {
          let cache = amount;
          amount = data.amount;
          minDate = Math.max(minDate, data.timestamp);

          const array: SimulatorRow[] = [];

          const action: SimulatorRow["action"] = {
            type: "snapshot",
            snapshotId: id
          };

          parseBankSnapshot(data).detail.forEach((d, i) => {
            cache += d.price;
            array.push({
              id: `${id}-${i}`,
              date: d.date,
              label: d.label,
              price: d.price,
              amount: cache,
              isArchive: true,
              action
            });
          });

          if (amount !== cache) {
            array.push({
              id,
              date: data.timestamp,
              label: "不明",
              amount,
              price: amount - cache,
              isArchive: true,
              action
            });
          }

          return array;
        })
        .flat();

      calcRangeDayArray(minDate, termEnd).forEach(cdata => {
        const { date, year: cy, month: cm, day: cd } = cdata;
        sourcePlanList2.forEach(({ id, data }) => {
          const { year, month, day, label, price, repeat, cardSummary } = data;
          const validRepeat = checkIsAfter(data, cdata) ? repeat : null;
          const flag =
            (year === cy || validRepeat) &&
            (month === cm || validRepeat === "month") &&
            day === cd;
          if (!flag) {
            return;
          }

          amount += price;

          if (date < termStart) {
            return;
          }
          rows.push({
            id,
            date,
            label,
            amount,
            price,
            isArchive: false,
            action: cardSummary
              ? {
                  type: "card-table",
                  cardId: cardSummary,
                  monthCode: calcCardStartMonthCode(data)
                }
              : { type: "plan", planId: id }
          });
        });
      });

      return { rows, amount };
    },
    []
  );

  const calcRowsFromCardTerm = useCallback(
    ({
      snapshotList,
      termStart,
      termEnd,
      cardId
    }: Pick<CardTerm, "snapshotList" | "termStart" | "termEnd" | "cardId">) =>
      calcRows({
        snapshotList,
        termStart,
        termEnd,
        nodeFilter: { type: "card", cardId },
        sourcePlanList: planList.map(({ id, data }) => ({
          id,
          data: { ...data, cardSummary: null }
        }))
      }),
    [calcRows, planList]
  );

  return { calcRows, calcRowsFromCardTerm };
};

export default useSimulatorRows;
