import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef
} from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockActionButton from "~/common/components/MockActionButton";
import { compact } from "~/common/lib/array-util";
import BankTableScene, { calcDayArray } from "~/app/components/BankTableScene";
import {
  MASTER_BANK_SNAPSHOT,
  MASTER_CARD_SNAPSHOT
} from "~/app/lib/master-data";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";

const BankTableSceneContainer = ({
  bankList,
  cardList,
  planList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
} & Pick<
  ComponentPropsWithoutRef<typeof BankTableScene>,
  "cardList" | "planList"
>) => {
  const [baseDate, setBaseDate] = useState(0);
  const [periodLength, setPeriodLength] = useState(60);
  const [bankId, setBankId] = useState<string | null>(null);

  const periodDays = useMemo(
    () => (baseDate ? calcDayArray(baseDate, periodLength) : []),
    [baseDate, periodLength]
  );

  const cardTerms1 = useMemo(
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
                card: data
              };
            })
          )
        )
        .flat(),
    [bankId, cardList, periodDays]
  );

  useEffect(() => {
    const [first] = bankList;
    if (!first) {
      return;
    }
    if (!bankId || !bankList.find(({ id }) => id === bankId)) {
      setBankId(first.id);
    }
  }, [bankId, bankList]);

  useEffect(() => {
    setBaseDate(Date.now());
  }, []);

  if (!bankId || !baseDate) {
    return <p>loading...</p>;
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
      <BankTableScene
        bankId={bankId}
        cardList={cardList}
        planList={planList}
        periodDays={periodDays}
        cardTerms1={cardTerms1}
        bankSnapshotList={MASTER_BANK_SNAPSHOT}
        cardSnapshotList={MASTER_CARD_SNAPSHOT}
      />
      <div>
        <MockActionButton
          action={{
            type: "button",
            onClick: () => setPeriodLength(l => l + 30)
          }}
        >
          30日分追加
        </MockActionButton>
      </div>
    </>
  );
};

export default BankTableSceneContainer;
