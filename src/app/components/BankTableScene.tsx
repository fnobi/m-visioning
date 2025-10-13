import { Fragment, useCallback, useMemo } from "react";
import { makeArray } from "~/common/lib/array-util";
import { em } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
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
  cardSnapshotList
}: {
  bankId: string;
  cardTerms: {
    cardId: string;
    card: MoneyCardAccount;
    year: number;
    month: number;
    day: number;
  }[];
  baseDate: number;
  periodLength: number;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  cardSnapshotList: TypedCollectionList<CardSnapshot>;
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
      const sourcePlanList2 = sourcePlanList.filter(({ data }) => {
        const { from, to } = data;
        const fromMatch = matchMoneyNode(from, nodeFilter);
        const toMatch = matchMoneyNode(to, nodeFilter);
        return fromMatch || toMatch;
      });

      // 前提： daysに対応する集計範囲のsnapshotは全部もらう
      // snapshotを古いものから順にrowsに起こしていく。
      // 最新のsnapshotよりさらに新しいeventをplanから組み立てられるようであれば、付け加える
      // snapshotがある範疇は事実ベースで・ないところはplanベースで組み立てるということになる
      //
      // # cardの場合
      // 初期値はかならず0
      // 期間外のsnapshotが影響する可能性は全く無いのでシンプルではある
      //
      // # bankの場合
      // 初期値は、 **daysの開始日より前の** いちばんあたらしいsnapshotから取るべき。なかったら0でいい。
      // これだけ、期間外のsnapshotを（1件でよいけど）取ってくる必要がある
      //
      // 結論、大枠では期間中のsnapshotを全部取ってくるという形で処理できる。
      // ただし、cardで集計するべき期間がベースの期間とは別で動的なのと、
      // bankについては1件だけ期間外を引っ張ってくる必要があるのが注意点
      //
      // あとたぶんdays配列をバカ丁寧に追っていく形じゃなくてもいいよな

      let amount = baseAmount;
      let minDate = 0;
      const rows = snapshotList
        .map<{
          id: string;
          date: number;
          label: string;
          amount: number;
          price: number;
        }>(({ id, data }) => {
          amount = data.amount;
          minDate = data.timestamp;

          // TODO: ほんとは、snapshotにココ用のrowを覚えさせて再現させたい
          return {
            id,
            date: data.timestamp,
            label: "snapshot",
            amount,
            price: 0
          };
        })
        .reverse();

      calcDayArray(startDate, daysCount).forEach(
        ({ date, year: cy, month: cm, day: cd }) => {
          if (minDate >= date) {
            return;
          }
          sourcePlanList2.forEach(({ id, data }) => {
            const { year, month, day, from } = data;
            const flag =
              (!year || year === cy) &&
              (!month || month === cm) &&
              (!day || day === cd);
            if (!flag) {
              return;
            }

            const { label, price: rawPrice } = data;
            const price =
              (matchMoneyNode(from, nodeFilter) ? -1 : 1) * rawPrice;
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
      cardTerms.map(p => {
        const { cardId, card, year, month } = p;
        const d = new Date(year, month - 1, card.startDay);
        const termEnd = new Date(d);
        termEnd.setMonth(termEnd.getMonth() - 1);
        const termStart = new Date(termEnd);
        termStart.setMonth(termStart.getMonth() - 1);
        const length =
          (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24);

        // TODO: このへんの検索はサーバー側で
        const snapshotList = cardSnapshotList.filter(
          ({ data }) =>
            data.cardId === cardId &&
            data.timestamp >= termStart.getTime() &&
            data.timestamp < termEnd.getTime()
        );

        const { amount } = calcRows({
          baseAmount: 0,
          snapshotList,
          startDate: termStart.getTime(),
          daysCount: length,
          nodeFilter: { type: "card", cardId },
          sourcePlanList: planList
        });
        return { ...p, amount };
      }),
    [calcRows, cardSnapshotList, cardTerms, planList]
  );

  const bankEvents = useMemo(() => {
    // TODO: このへんの絞り込みはサーバー検索側で
    const startDate = baseDate;
    const endDate = startDate + periodLength * 1000 * 60 * 60 * 24;
    const snapshotList = bankSnapshotList.filter(
      ({ data }) =>
        data.bankId === bankId &&
        data.timestamp >= startDate &&
        data.timestamp < endDate
    );
    const lastSnapshot = bankSnapshotList.find(
      ({ data }) => data.bankId === bankId && data.timestamp < startDate
    );

    const cardPaymentPlanList = cardAmount.map<{
      id: string;
      data: MoneyPlan;
    }>(({ cardId, card, year, month, day, amount }) => ({
      id: [year, month, cardId].join("_"),
      data: {
        year,
        month,
        day,
        hour: 0,
        minute: 0,
        price: -amount,
        label: card.label,
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
      baseAmount: lastSnapshot ? lastSnapshot.data.amount : 0,
      snapshotList,
      startDate,
      daysCount: periodLength,
      nodeFilter: { type: "bank", bankId },
      sourcePlanList: [...planList, ...cardPaymentPlanList]
    });
  }, [
    bankId,
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
