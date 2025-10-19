import { Fragment, useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { compact, makeArray } from "~/common/lib/array-util";
import { em } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import MockActionButton from "~/common/components/MockActionButton";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import { parseBankSnapshot } from "~/app/scheme/BankSnapshot";

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

const TableCell = styled.p<{ isArchive: boolean; align?: "left" | "right" }>(
  ({ isArchive, align = "left" }) => ({
    opacity: isArchive ? 0.5 : 1,
    textAlign: align
  })
);

const BankTableScene = ({
  bankId,
  cardTerms,
  baseDate,
  periodLength,
  planList,
  bankSnapshotList,
  lastBankSnapshot,
  onCreateBankSnapshot
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
  onCreateBankSnapshot: (v: BankSnapshot) => void;
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
      const rows = [...snapshotList]
        .reverse()
        .map(({ id, data }) => {
          let cache = amount;
          amount = data.amount;
          minDate = Math.max(minDate, data.timestamp);

          const array: {
            id: string;
            date: number;
            label: string;
            amount: number;
            price: number;
            isArchive: boolean;
          }[] = [];

          parseBankSnapshot(data).detail.forEach((d, i) => {
            cache += d.price;
            array.push({
              id: `${id}-${i}`,
              date: d.date,
              label: d.label,
              price: d.price,
              amount: cache,
              isArchive: true
            });
          });

          if (amount !== cache) {
            array.push({
              id,
              date: data.timestamp,
              label: "不明",
              amount,
              price: amount - cache,
              isArchive: true
            });
          }

          return array;
        })
        .flat();

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
            rows.push({ id, date, label, amount, price, isArchive: false });
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

  const createBankSnapshotDraft = useMemo(() => {
    if (!bankId) {
      return null;
    }
    return () => {
      const timestamp = Date.now();
      const diffSnapshot =
        bankSnapshotList && bankSnapshotList.length
          ? bankSnapshotList[0].data
          : lastBankSnapshot;

      const detail: BankSnapshot["detail"] = bankEvents.rows
        .filter(
          r => r.date > (diffSnapshot?.timestamp ?? 0) && r.date <= Date.now()
        )
        .map(r => ({
          label: r.label,
          price: r.price,
          date: r.date
        }));
      let amount = diffSnapshot?.amount ?? 0;
      detail.forEach(r => {
        amount += r.price;
      });

      onCreateBankSnapshot({
        bankId,
        amount,
        timestamp,
        detail
      });
    };
  }, [
    bankEvents.rows,
    bankId,
    bankSnapshotList,
    lastBankSnapshot,
    onCreateBankSnapshot
  ]);

  return (
    <>
      <p>
        <MockActionButton
          action={
            createBankSnapshotDraft
              ? {
                  type: "button",
                  onClick: createBankSnapshotDraft
                }
              : null
          }
        >
          口座ログ追加
        </MockActionButton>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: em(4, "auto", 6, 6)
        }}
      >
        {bankEvents.rows.map(
          ({ date, id, label, price, amount, isArchive }) => (
            <Fragment key={[date, id].join("_")}>
              <TableCell isArchive={isArchive}>
                {formatDateLabel(date)}
              </TableCell>
              <TableCell isArchive={isArchive}>{label}</TableCell>
              <TableCell isArchive={isArchive} align="right">
                {price}
              </TableCell>
              <TableCell isArchive={isArchive} align="right">
                {amount}
              </TableCell>
            </Fragment>
          )
        )}
      </div>
    </>
  );
};

export default BankTableScene;
