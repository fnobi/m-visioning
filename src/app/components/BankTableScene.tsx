import { Fragment, useCallback, useMemo } from "react";
import { compact, makeArray } from "~/common/lib/array-util";
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

const BankTableScene = ({
  bankId,
  cardTerms1,
  periodDays,
  cardList,
  planList,
  bankSnapshotList,
  cardSnapshotList
}: {
  bankId: string;
  cardTerms1: {
    cardId: string;
    card: MoneyCardAccount;
    year: number;
    month: number;
    day: number;
    // date: number;
  }[];
  periodDays: {
    year: number;
    month: number;
    day: number;
    date: number;
  }[];
  cardList: TypedCollectionList<MoneyCardAccount>;
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
      lastSnapshot,
      da,
      nodeFilter,
      sourcePlanList
    }: {
      // TODO: planを計算すべきかどうかの基準点と、全体の起算にすべき値はcardの場合別である
      lastSnapshot: BankSnapshot | CardSnapshot | null;
      da: { date: number; year: number; month: number; day: number }[];
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<MoneyPlan>;
    }) => {
      let amount = lastSnapshot ? lastSnapshot.price : 0;
      const rows = da
        .map(({ date, year: cy, month: cm, day: cd }) => {
          if (lastSnapshot && lastSnapshot.timestamp >= date) {
            return [];
          }
          const plans = compact(
            sourcePlanList.map(({ id, data }) => {
              const { year, month, day, from, to } = data;
              const fromMatch = matchMoneyNode(from, nodeFilter);
              const toMatch = matchMoneyNode(to, nodeFilter);
              const flag =
                (fromMatch || toMatch) &&
                (!year || year === cy) &&
                (!month || month === cm) &&
                (!day || day === cd);
              if (!flag) {
                return null;
              }

              const { label, price: rawPrice } = data;
              const price = (fromMatch ? -1 : 1) * rawPrice;
              amount += price;
              return { id, date, label, amount, price };
            })
          );

          return plans;
        })
        .flat();

      return { rows, amount };
    },
    [matchMoneyNode]
  );

  const calcCardPeriodResult = useCallback(
    (cardId: string, paymentYear: number, paymentMonth: number) => {
      const card = cardList.find(c => c.id === cardId);
      if (!card) {
        return { amount: 0, rows: [] };
      }
      const d = new Date(paymentYear, paymentMonth - 1, card.data.startDay);
      const termEnd = new Date(d);
      termEnd.setMonth(termEnd.getMonth() - 1);
      const termStart = new Date(termEnd);
      termStart.setMonth(termStart.getMonth() - 1);
      const length =
        (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24);
      const lastSnapshot = cardSnapshotList.find(
        ({ data }) =>
          data.cardId === cardId &&
          data.timestamp >= termStart.getTime() &&
          data.timestamp < termEnd.getTime()
      );
      const { rows, amount } = calcRows({
        lastSnapshot: lastSnapshot ? lastSnapshot.data : null,
        da: calcDayArray(termStart.getTime(), length),
        nodeFilter: { type: "card", cardId },
        sourcePlanList: planList
      });
      return { rows, amount };
    },
    [calcRows, cardList, cardSnapshotList, planList]
  );

  const cardTerms = useMemo(
    () =>
      cardTerms1.map(p => {
        const { amount } = calcCardPeriodResult(p.cardId, p.year, p.month);
        return {
          ...p,
          price: amount
        };
      }),
    [calcCardPeriodResult, cardTerms1]
  );

  const bankEvents = useMemo(() => {
    const lastSnapshot = bankSnapshotList.find(
      ({ data }) => data.bankId === bankId
    );
    const cardPaymentPlanList = cardTerms.map<{
      id: string;
      data: MoneyPlan;
    }>(({ cardId, card, year, month, day, price }) => ({
      id: [year, month, cardId].join("_"),
      data: {
        year,
        month,
        day,
        hour: 0,
        minute: 0,
        price: -price,
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
      lastSnapshot: lastSnapshot ? lastSnapshot.data : null,
      da: periodDays,
      nodeFilter: { type: "bank", bankId },
      sourcePlanList: [...planList, ...cardPaymentPlanList]
    });
  }, [bankId, bankSnapshotList, calcRows, cardTerms, periodDays, planList]);

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
