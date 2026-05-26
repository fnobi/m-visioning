import { useCallback } from "react";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import type BankSnapshot from "@m-visioning/core/scheme/BankSnapshot";
import { type ToMoneyNode, type FromMoneyNode } from "@m-visioning/core/scheme/MoneyPlan";
import type CardSnapshot from "@m-visioning/core/scheme/CardSnapshot";
import { parseBankSnapshot } from "@m-visioning/core/scheme/BankSnapshot";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { compact, makeArray, sortBy } from "~/common/lib/array-util";

type CardLink = {
  cardLink?: {
    cardId: string;
    monthCode: number;
  };
};

export type MoneyPlanWithCardLink = MoneyPlan & CardLink;

export type SimulatorRow = {
  id: string;
  date: number;
  label: string;
  amount: number;
  price: number;
  isArchive: boolean;
  source:
    | { type: "plan"; planId: string; category: string }
    | {
        type: "snapshot";
        snapshotId: string;
      }
    | null;
} & CardLink;

export type CardTerm = {
  cardId: string;
  label: string;
  termStart: number;
  termEnd: number;
  paymentDate: {
    year: number;
    month: number;
    day: number;
  };
  sourceMonthCode: number;
  minAmount: number;
  snapshotList: TypedCollectionList<CardSnapshot>;
};

const calcDayArray = (startTimestamp: number, length: number) => {
  const validLength = Math.floor(length);
  if (validLength <= 0) {
    return [];
  }

  const startDate = new Date(startTimestamp);
  startDate.setHours(0);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  startDate.setMilliseconds(0);
  const st = startDate.getTime();

  return makeArray(validLength).map((z, i) => {
    const date = st + 1000 * 60 * 60 * 24 * i;
    const d = new Date(date);
    return {
      date,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    };
  });
};

export const calcRangeDayArray = (st: number, end: number) =>
  calcDayArray(st, (end - st) / (1000 * 60 * 60 * 24));

const calcMonthCode = (d: { year: number; month: number }) =>
  d.year * 100 + d.month;

export const calcMonthCodeFromDate = (d: Date) =>
  calcMonthCode({
    year: d.getFullYear(),
    month: d.getMonth() + 1
  });

export const calcDateParamInt = (d: {
  year: number;
  month: number;
  day: number;
}) => calcMonthCode(d) * 100 + d.day;

export const calcCardStartMonthCode = ({
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

const useSimulatorRows = () => {
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
      } | null;
      snapshotList: TypedCollectionList<BankSnapshot | CardSnapshot> | null;
      // TODO: cardId/bankIdで絞り込み済みのplanListを渡すようにして、1個にまとめたい
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<MoneyPlanWithCardLink>;
    }) => {
      if (termStart >= termEnd) {
        return { rows: [], amount: 0 };
      }

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
      let lastSnapshotTimestamp = 0;
      const rows = (snapshotList ? [...snapshotList].reverse() : [])
        .map(({ id, data }) => {
          let cache = amount;
          amount = data.amount;
          lastSnapshotTimestamp = Math.max(
            lastSnapshotTimestamp,
            data.timestamp
          );

          const array: SimulatorRow[] = [];

          const source: SimulatorRow["source"] = {
            type: "snapshot",
            snapshotId: id
          };

          sortBy([...parseBankSnapshot(data).detail], d => d.date).forEach(
            (d, i) => {
              cache += d.price;
              array.push({
                id: `${id}-${i}`,
                date: d.date,
                label: d.label,
                price: d.price,
                amount: cache,
                isArchive: true,
                source
              });
            }
          );

          if (amount !== cache) {
            array.push({
              id,
              date: data.timestamp,
              label: "不明",
              amount,
              price: amount - cache,
              isArchive: true,
              source
            });
          }

          return array;
        })
        .flat();

      // planシミュレーション開始日
      // snapshotがあるならその翌日から・ないなら期の最初から
      let planStart = termStart;
      if (lastSnapshotTimestamp) {
        const d = new Date(lastSnapshotTimestamp);
        d.setDate(d.getDate() + 1);
        planStart = d.getTime();
      }

      calcRangeDayArray(planStart, termEnd).forEach(cdata => {
        const { date, year: cy, month: cm, day: cd } = cdata;
        sourcePlanList2.forEach(({ id, data }) => {
          const { year, month, day, label, price, repeat, cardLink, category } =
            data;
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
            source: { type: "plan", planId: id, category },
            cardLink
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
      cardId,
      planList
    }: Pick<CardTerm, "snapshotList" | "termStart" | "termEnd" | "cardId"> & {
      planList: TypedCollectionList<MoneyPlan>;
    }) =>
      calcRows({
        snapshotList,
        termStart,
        termEnd,
        nodeFilter: { type: "card", cardId },
        sourcePlanList: planList
      }),
    [calcRows]
  );

  return { calcRows, calcRowsFromCardTerm };
};

export default useSimulatorRows;
