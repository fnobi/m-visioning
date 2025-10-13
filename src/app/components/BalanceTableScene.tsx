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

const BalanceTableScene = ({
  bankList,
  cardList,
  planList,
  bankSnapshotList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
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

  const calcCardPeriodResult = useCallback(
    (cardId: string, paymentYear: number, paymentMonth: number) => {
      const card = cardList.find(c => c.id === cardId);
      if (!card) {
        return 0;
      }
      const d = new Date(paymentYear, paymentMonth - 1, card.data.startDay);
      const termEnd = new Date(d);
      termEnd.setMonth(termEnd.getMonth() - 1);
      const termStart = new Date(termEnd);
      termStart.setMonth(termStart.getMonth() - 1);
      const length =
        (termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24);

      let amount = 0;
      calcDayArray(termStart.getTime(), length)
        .map(({ date, year: cy, month: cm, day: cd }) => {
          // TODO: 最新スナップショットより古い日付のときだけ処理
          const plans = compact([
            ...planList.map(({ id, data }) => {
              const { year, month, day, from } = data;
              const flag =
                from.type === "card" &&
                from.cardId === cardId &&
                (!year || year === cy) &&
                (!month || month === cm) &&
                (!day || day === cd);
              if (!flag) {
                return null;
              }

              const { label, price: rawPrice } = data;
              const price = -1 * rawPrice;
              amount += price;
              return { id, date, label, price };
            })
          ]);

          return plans;
        })
        .flat();

      return amount;
    },
    [calcDayArray, cardList, planList]
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
              return {
                ...p,
                cardId: id,
                card: data,
                price: calcCardPeriodResult(id, p.year, p.month)
              };
            })
          )
        )
        .flat(),
    [bankId, calcCardPeriodResult, cardList, periodDays]
  );

  const calcBalanceRows = useCallback(
    ({ baseAmount }: { baseAmount: number }) => {
      const cardPaymentPlanList = bankId
        ? cardTerms.map<{ id: string; data: MoneyPlan }>(
            ({ cardId, card, price, date, year, month, day }) => ({
              id: [date, cardId].join("_"),
              data: {
                year,
                month,
                day,
                hour: 0,
                minute: 0,
                label: card.label,
                price,
                from: {
                  type: "bank",
                  bankId
                },
                to: {
                  type: "output"
                }
              }
            })
          )
        : [];
      let amount = baseAmount;
      return periodDays
        .map(({ date, year: cy, month: cm, day: cd }) => {
          // TODO: 最新スナップショットより古い日付のときだけ処理
          const plans = compact([
            ...[...planList, ...cardPaymentPlanList].map(({ id, data }) => {
              const { year, month, day, from, to } = data;
              const flag =
                ((from.type === "bank" && from.bankId === bankId) ||
                  (to.type === "bank" && to.bankId === bankId)) &&
                (!year || year === cy) &&
                (!month || month === cm) &&
                (!day || day === cd);
              if (!flag) {
                return null;
              }

              const { label, price: rawPrice } = data;
              const price =
                (from.type === "bank" && from.bankId === bankId ? -1 : 1) *
                rawPrice;
              amount += price;
              return { id, date, label, amount, price };
            })
          ]);

          return plans;
        })
        .flat();
    },
    [bankId, cardTerms, periodDays, planList]
  );

  const bankEvents = useMemo(() => {
    if (!baseDate) {
      return [];
    }
    const lastSnapshot = bankSnapshotList.find(
      ({ data }) => data.bankId === bankId
    );
    return calcBalanceRows({
      baseAmount: lastSnapshot ? lastSnapshot.data.price : 0
    });
  }, [bankId, bankSnapshotList, baseDate, calcBalanceRows]);

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
          {bankEvents.map(({ date, id, label, price, amount }) => (
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
