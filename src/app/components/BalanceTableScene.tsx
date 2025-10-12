import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { compact, makeArray } from "~/common/lib/array-util";
import { em } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
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
  const [periodDays] = useState(60);

  const calcBalanceRows = useCallback(
    ({
      baseAmount,
      planMatch
    }: {
      baseAmount: number;
      planMatch: (p: FromMoneyNode | ToMoneyNode) => boolean;
    }) => {
      let amount = baseAmount;
      return makeArray(periodDays)
        .map((z, i) => {
          const date = baseDate + 1000 * 60 * 60 * 24 * i;
          const d = new Date(date);
          const cy = d.getFullYear();
          const cm = d.getMonth() + 1;
          const cd = d.getDate();
          const plans = compact(
            planList.map(({ id, data }) => {
              const { year, month, day, from, to } = data;
              const flag =
                (planMatch(from) || planMatch(to)) &&
                (!year || year === cy) &&
                (!month || month === cm) &&
                (!day || day === cd);
              if (!flag) {
                return null;
              }

              const { label, price: rawPrice } = data;
              const price = (planMatch(from) ? -1 : 1) * rawPrice;
              amount += price;
              return { id, date, label, amount, price };
            })
          );
          return plans;
        })
        .flat();
    },
    [planList, baseDate, periodDays]
  );

  const bankAccountPlanMap = useMemo(() => {
    if (!baseDate) {
      return [];
    }
    return bankList.map(({ id: bankId, data: bank }) => {
      const lastSnapshot = bankSnapshotList.find(
        ({ data }) => data.bankId === bankId
      );
      const events = calcBalanceRows({
        baseAmount: lastSnapshot ? lastSnapshot.data.price : 0,
        planMatch: p => p.type === "bank" && p.bankId === bankId
      });
      return { bankId, bank, events };
    });
  }, [bankSnapshotList, bankList, baseDate, calcBalanceRows]);

  const cardAccountPlanMap = useMemo(() => {
    if (!baseDate) {
      return [];
    }
    return cardList.map(({ id: cardId, data: card }) => {
      const events = calcBalanceRows({
        baseAmount: 0,
        planMatch: p => p.type === "card" && p.cardId === cardId
      });
      return { cardId, card, events };
    });
  }, [cardList, baseDate, calcBalanceRows]);

  useEffect(() => {
    setBaseDate(Date.now());
  }, []);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {baseDate ? (
        <>
          {bankAccountPlanMap.map(({ bankId, bank, events }) => (
            <div key={bankId}>
              <p>▼{bank.label}</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: em(4, "auto", 6, 6)
                }}
              >
                {events.map(({ date, id, label, price, amount }) => (
                  <Fragment key={[date, id].join("_")}>
                    <p>{formatDateLabel(date)}</p>
                    <p>{label}</p>
                    <p style={{ textAlign: "right" }}>{price}</p>
                    <p style={{ textAlign: "right" }}>{amount}</p>
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
          {cardAccountPlanMap.map(({ cardId, card, events }) => (
            <div key={cardId}>
              <p>▼{card.label}</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: em(4, "auto", 6, 6)
                }}
              >
                {events.map(({ date, id, label, price, amount }) => (
                  <Fragment key={[date, id].join("_")}>
                    <p>{formatDateLabel(date)}</p>
                    <p>{label}</p>
                    <p style={{ textAlign: "right" }}>{price}</p>
                    <p style={{ textAlign: "right" }}>{amount}</p>
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
          <hr />
        </>
      ) : null}
    </>
  );
};

export default BalanceTableScene;
