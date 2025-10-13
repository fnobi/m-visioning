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
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const BankTableSceneContainer = ({
  bankList,
  cardList,
  planList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
} & Pick<ComponentPropsWithoutRef<typeof BankTableScene>, "planList">) => {
  const [baseDate, setBaseDate] = useState(0);
  const [periodLength, setPeriodLength] = useState(60);
  const [bankId, setBankId] = useState<string | null>(null);

  const [bankSnapshotList, setBankSnapshotList] =
    useState<TypedCollectionList<BankSnapshot> | null>(null);
  const [lastBankSnapshot, setLastBankSnapshot] = useState<BankSnapshot | null>(
    null
  );

  useEffect(() => {
    const startDate = baseDate;
    const endDate = startDate + periodLength * 1000 * 60 * 60 * 24;

    // TODO: サーバーから取得
    const snapshotList = MASTER_BANK_SNAPSHOT.filter(
      ({ data }) =>
        data.bankId === bankId &&
        data.timestamp >= startDate &&
        data.timestamp < endDate
    );
    setBankSnapshotList(snapshotList);
  }, [bankId, baseDate, periodLength]);

  useEffect(() => {
    // TODO: サーバーから取得
    const lastSnapshot = MASTER_BANK_SNAPSHOT.filter(
      ({ data }) => data.bankId === bankId && data.timestamp < baseDate
    );
    const [first] = lastSnapshot;
    setLastBankSnapshot(first ? first.data : null);
  }, [bankId, baseDate]);

  const cardTerms = useMemo(() => {
    const periodDays = baseDate ? calcDayArray(baseDate, periodLength) : [];
    return periodDays
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
      .flat();
  }, [bankId, baseDate, cardList, periodLength]);

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
    const d = new Date();
    d.setDate(1); // TODO: 設定可能にしたい
    setBaseDate(d.getTime());
  }, []);

  if (!bankId || !baseDate || !bankSnapshotList) {
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
        planList={planList}
        baseDate={baseDate}
        periodLength={periodLength}
        cardTerms={cardTerms}
        bankSnapshotList={bankSnapshotList}
        lastBankSnapshot={lastBankSnapshot}
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
