import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef
} from "react";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockActionButton from "~/common/components/MockActionButton";
import { compact } from "~/common/lib/array-util";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import NewBankSnapshotPopup from "~/app/components/NewBankSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import BankTableScene, { calcDayArray } from "~/app/components/BankTableScene";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import { useBankSnapshotList } from "~/app/lib/database/bank-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const BankTableSceneContainer = ({
  bankList,
  cardList,
  planList
}: {
  bankList: TypedCollectionList<MoneyBankAccount>;
  cardList: TypedCollectionList<MoneyCardAccount>;
} & Pick<ComponentPropsWithoutRef<typeof BankTableScene>, "planList">) => {
  const { myId } = useAuthorizedUser();
  const [baseDate, setBaseDate] = useState(0);
  const [periodLength, setPeriodLength] = useState(60);
  const [bankId, setBankId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [snapshotDraft, setSnapshotDraft] = useState<BankSnapshot | null>(null);

  const { bankSnapshotList, createBankSnapshot } = useBankSnapshotList({
    userId: myId,
    bankId: bankId || "",
    minTimestamp: baseDate,
    maxTimestamp: baseDate + periodLength * 1000 * 60 * 60 * 24,
    onError: setStatusError
  });
  const { bankSnapshotList: beforeSnapshotList } = useBankSnapshotList({
    userId: myId,
    bankId: bankId || "",
    maxTimestamp: baseDate,
    limit: 1,
    onError: setStatusError
  });
  const { cardSnapshotList } = useCardSnapshotList({
    // TODO: 全件検索やめたいね
    userId: myId,
    onError: setStatusError
  });

  const lastBankSnapshot = useMemo(() => {
    const [first] = beforeSnapshotList || [];
    return first ? first.data : null;
  }, [beforeSnapshotList]);

  const cardTerms = useMemo(
    () =>
      (baseDate ? calcDayArray(baseDate, periodLength) : [])
        .map(({ year, month, day }) =>
          compact(
            cardList.map(({ id, data: card }) => {
              if (card.startDay !== day || card.bankId !== bankId) {
                return null;
              }

              const d = new Date(year, month - 1, day);
              const termEndDate = new Date(d);
              termEndDate.setMonth(termEndDate.getMonth() - 1);
              const termEnd = termEndDate.getTime();
              const termStartDate = new Date(termEndDate);
              termStartDate.setMonth(termStartDate.getMonth() - 1);
              const termStart = termStartDate.getTime();

              const snapshotList = (cardSnapshotList || []).filter(
                ({ data: snapshot }) =>
                  snapshot.cardId === id &&
                  snapshot.timestamp >= termStart &&
                  snapshot.timestamp < termEnd
              );

              return {
                cardId: id,
                year,
                month,
                day,
                label: card.label,
                termStart,
                termEnd,
                snapshotList
              };
            })
          )
        )
        .flat(),
    [bankId, baseDate, cardList, cardSnapshotList, periodLength]
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
    const d = new Date();
    d.setDate(1); // TODO: 設定可能にしたい
    setBaseDate(d.getTime());
  }, []);

  const handleCreate = useCallback(
    async (v: BankSnapshot) => {
      await createBankSnapshot(v);
      setSnapshotDraft(null);
    },
    [createBankSnapshot]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

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
        onCreateBankSnapshot={setSnapshotDraft}
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
      {snapshotDraft ? (
        <NewBankSnapshotPopup
          value={snapshotDraft}
          onClose={() => setSnapshotDraft(null)}
          onChange={setSnapshotDraft}
          onSubmit={handleCreate}
        />
      ) : null}
    </>
  );
};

export default BankTableSceneContainer;
