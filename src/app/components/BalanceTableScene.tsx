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
  const [bankId, setBankId] = useState(bankList[0].id);

  const periodDays = useMemo(
    () =>
      makeArray(periodLength).map((z, i) => {
        const date = baseDate + 1000 * 60 * 60 * 24 * i;
        const d = new Date(date);
        return {
          date,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate()
        };
      }),
    [baseDate, periodLength]
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
                price: 0 // TODO
              };
            })
          )
        )
        .flat(),
    [bankId, cardList, periodDays]
  );

  const calcBalanceRows = useCallback(
    ({ baseAmount }: { baseAmount: number }) => {
      let amount = baseAmount;
      const aaa: TypedCollectionList<MoneyPlan> = [
        ...planList,
        ...cardTerms.map(({ cardId, card, price, date, year, month, day }) => {
          const data: MoneyPlan = {
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
          };
          return {
            id: [date, cardId].join("_"),
            data
          };
        })
      ];
      return periodDays
        .map(({ date, year: cy, month: cm, day: cd }) => {
          const plans = compact([
            ...aaa.map(({ id, data }) => {
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
      <p>
        <select value={bankId} onChange={e => setBankId(e.target.value)}>
          {bankList.map(({ id, data }) => (
            <option key={id} value={id}>
              {data.label}
            </option>
          ))}
        </select>
      </p>
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
