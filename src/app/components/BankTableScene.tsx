import { Fragment, useCallback, useMemo } from "react";
import { compact, makeArray } from "~/common/lib/array-util";
import { em } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

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
  calcDayArray(st, (end - st) / (1000 * 60 * 60 * 24));

const BankTableScene = ({
  bankId,
  cardTerms,
  baseDate,
  periodLength,
  planList,
  bankSnapshotList,
  lastBankSnapshot
}: {
  bankId: string;
  cardTerms: {
    cardId: string;
    year: number;
    month: number;
    day: number;
    label: string;
    termStart: number;
    termEnd: number;
    snapshotList: TypedCollectionList<CardSnapshot>;
  }[];
  baseDate: number;
  periodLength: number;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  lastBankSnapshot: BankSnapshot | null;
}) => {
  const matchMoneyNode = useCallback(
    (n1: FromMoneyNode | ToMoneyNode, n2: FromMoneyNode | ToMoneyNode) => {
      if (n1.type === "bank") {
        return n2.type === "bank" && n1.bankId === n2.bankId;
      }
      if (n1.type === "card") {
        return n2.type === "card" && n1.cardId === n2.cardId;
      }
      return false;
    },
    []
  );

  const calcRows = useCallback(
    ({
      startDate,
      daysCount,
      baseAmount,
      snapshotList,
      nodeFilter,
      sourcePlanList
    }: {
      startDate: number;
      daysCount: number;
      baseAmount: number;
      snapshotList: TypedCollectionList<BankSnapshot | CardSnapshot>;
      // TODO: cardId/bankIdで絞り込み済みのplanListを渡すようにして、1個にまとめたい
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<MoneyPlan>;
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

      let amount = baseAmount;
      let minDate = 0;
      const rows = [...snapshotList].reverse().map<{
        id: string;
        date: number;
        label: string;
        amount: number;
        price: number;
      }>(({ id, data }) => {
        const diff = data.amount - amount;
        amount = data.amount;
        minDate = Math.max(minDate, data.timestamp);

        // TODO: ほんとは、snapshotにココ用のrowを覚えさせて再現させたい
        return {
          id,
          date: data.timestamp,
          label: "(snapshot)",
          amount,
          price: diff
        };
      });

      calcDayArray(startDate, daysCount).forEach(
        ({ date, year: cy, month: cm, day: cd }) => {
          if (minDate >= date) {
            return;
          }
          sourcePlanList2.forEach(({ id, data }) => {
            const { year, month, day, label, price } = data;
            const flag =
              (!year || year === cy) &&
              (!month || month === cm) &&
              (!day || day === cd);
            if (!flag) {
              return;
            }

            amount += price;
            rows.push({ id, date, label, amount, price });
          });
        }
      );

      return { rows, amount };
    },
    [matchMoneyNode]
  );

  const cardAmount = useMemo(
    () =>
      cardTerms.map(
        ({
          cardId,
          year,
          month,
          day,
          label,
          termStart,
          termEnd,
          snapshotList
        }) => {
          const key = [year, month, cardId].join("_");
          const { amount } = calcRows({
            baseAmount: 0,
            snapshotList,
            startDate: termStart,
            daysCount: (termEnd - termStart) / (1000 * 60 * 60 * 24),
            nodeFilter: { type: "card", cardId },
            sourcePlanList: planList
          });
          return { key, year, month, day, label, amount };
        }
      ),
    [calcRows, cardTerms, planList]
  );

  const bankEvents = useMemo(() => {
    const cardPaymentPlanList = cardAmount.map<{
      id: string;
      data: MoneyPlan;
    }>(({ key, year, month, day, label, amount }) => ({
      id: key,
      data: {
        year,
        month,
        day,
        hour: 0,
        minute: 0,
        price: -amount,
        label,
        from: {
          type: "bank",
          bankId
        },
        to: {
          type: "output"
        }
      }
    }));
    return calcRows({
      baseAmount: lastBankSnapshot ? lastBankSnapshot.amount : 0,
      snapshotList: bankSnapshotList,
      startDate: baseDate,
      daysCount: periodLength,
      nodeFilter: { type: "bank", bankId },
      sourcePlanList: [...planList, ...cardPaymentPlanList]
    });
  }, [
    bankId,
    lastBankSnapshot,
    bankSnapshotList,
    baseDate,
    calcRows,
    cardAmount,
    periodLength,
    planList
  ]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: em(4, "auto", 6, 6)
      }}
    >
      {bankEvents.rows.map(({ date, id, label, price, amount }) => (
        <Fragment key={[date, id].join("_")}>
          <p>{formatDateLabel(date)}</p>
          <p>{label}</p>
          <p style={{ textAlign: "right" }}>{price}</p>
          <p style={{ textAlign: "right" }}>{amount}</p>
        </Fragment>
      ))}
    </div>
  );
};

export default BankTableScene;
