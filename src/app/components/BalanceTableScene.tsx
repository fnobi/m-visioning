import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { compact, makeArray } from "~/common/lib/array-util";
import { em } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

const BalanceTableScene = ({
  bankList,
  cardList,
  planList,
  bankSnapshotList,
  cardSnapshotList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  cardSnapshotList: TypedCollectionList<CardSnapshot>;
}) => {
  const [baseDate, setBaseDate] = useState(0);
  const [periodLength] = useState(60);
  const [bankId, setBankId] = useState<string | null>(null);

  useEffect(() => {
    const [first] = bankList;
    if (!first) {
      return;
    }
    if (!bankId || !bankList.find(({ id }) => id === bankId)) {
      setBankId(first.id);
    }
  }, [bankId, bankList]);

  const calcDayArray = useCallback(
    (st: number, length: number) =>
      makeArray(length).map((z, i) => {
        const date = st + 1000 * 60 * 60 * 24 * i;
        const d = new Date(date);
        return {
          date,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate()
        };
      }),
    []
  );

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
    [calcDayArray, calcRows, cardList, cardSnapshotList, planList]
  );

  const periodDays = useMemo(
    () => (baseDate ? calcDayArray(baseDate, periodLength) : []),
    [baseDate, calcDayArray, periodLength]
  );

  const cardTerms = useMemo(
    () =>
      periodDays
        .map(p =>
          compact(
            cardList.map(({ id, data }) => {
              if (data.startDay !== p.day || data.bankId !== bankId) {
                return null;
              }
              const { amount } = calcCardPeriodResult(id, p.year, p.month);
              return {
                ...p,
                cardId: id,
                card: data,
                price: amount
              };
            })
          )
        )
        .flat(),
    [bankId, calcCardPeriodResult, cardList, periodDays]
  );

  const bankEvents = useMemo(() => {
    if (!baseDate || !bankId) {
      return { amount: 0, rows: [] };
    }
    const lastSnapshot = bankSnapshotList.find(
      ({ data }) => data.bankId === bankId
    );
    const cardPaymentPlanList = cardTerms.map<{
      id: string;
      data: MoneyPlan;
    }>(({ cardId, card, date, price, ...params }) => ({
      id: [date, cardId].join("_"),
      data: {
        ...params,
        price: -price,
        hour: 0,
        minute: 0,
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
  }, [
    bankId,
    bankSnapshotList,
    baseDate,
    calcRows,
    cardTerms,
    periodDays,
    planList
  ]);

  useEffect(() => {
    setBaseDate(Date.now());
  }, []);

  if (!baseDate) {
    return <MockLoadingScene />;
  }

  return (
    <>
      {bankId ? (
        <p>
          <select value={bankId} onChange={e => setBankId(e.target.value)}>
            {bankList.map(({ id, data }) => (
              <option key={id} value={id}>
                {data.label}
              </option>
            ))}
          </select>
        </p>
      ) : null}
      <div>
        <p>▼通帳</p>
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
      </div>
    </>
  );
};

export default BalanceTableScene;
