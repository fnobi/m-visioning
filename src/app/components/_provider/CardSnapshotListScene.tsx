import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import MockActionButton from "~/common/components/MockActionButton";
import usePopupOperation from "~/common/lib/usePopupOperation";
import CardAccountFormPopup from "~/app/components/CardAccountFormPopup";
import CardSelectPopup from "~/app/components/CardSelectPopup";
import ErrorPopup from "~/app/components/ErrorPopup";
import PlanFormPopup from "~/app/components/PlanFormPopup";
import SimulatorTableView from "~/app/components/SimulatorTableView";
import MonthCursorNavi from "~/app/components/MonthCursorNavi";
import CardSnapshotFormPopup from "~/app/components/CardSnapshotPopup";
import ErrorScene from "~/app/components/ErrorScene";
import { useCardSnapshotList } from "~/app/lib/database/card-snapshot-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import type useMonthCursor from "~/app/lib/useMonthCursor";
import useSimulatorRows, {
  type SimulatorRow
} from "~/app/lib/useSimulatorRows";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { useMyMoneyPlanTools } from "~/app/lib/database/money-plan-database";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { useMyCardAccountTools } from "~/app/lib/database/card-account-database";
import { parseMoneyCardAccount } from "~/app/scheme/MoneyCardAccount";

type PopupParams =
  | {
      type: "create-card-snapshot";
      defaultValue: CardSnapshot;
    }
  | {
      type: "edit-card-snapshot";
      snapshotId: string;
      defaultValue: CardSnapshot;
    }
  | {
      type: "edit-plan";
      planId: string;
      defaultValue: MoneyPlan;
    }
  | {
      type: "select-card";
    }
  | {
      type: "edit-card-account";
      cardId: string;
      defaultValue: MoneyCardAccount;
    }
  | {
      type: "create-card-account";
      defaultValue: MoneyCardAccount;
    };

const CardSnapshotListScene = ({
  cardId,
  cardList,
  bankList,
  planList,
  monthCursor,
  onChangeCard
}: {
  cardId: string;
  cardList: TypedCollectionList<MoneyCardAccount>;
  bankList: TypedCollectionList<MoneyBankAccount>;
  planList: TypedCollectionList<MoneyPlan>;
  monthCursor: ReturnType<typeof useMonthCursor>;
  onChangeCard: (id: string) => void;
}) => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { popup, clearPopup, addPopup, closeCurrentPopup } =
    usePopupOperation<PopupParams>();
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const [draftTimestamp, setDraftTimestamp] = useState(0);

  const {
    cardSnapshotList,
    writeCardSnapshot,
    deleteCardSnapshot,
    createCardSnapshot
  } = useCardSnapshotList({
    userId: myId,
    cardId,
    minTimestamp: monthCursor.minTimestamp,
    maxTimestamp: monthCursor.maxTimestamp,
    onError: setStatusError
  });
  const { createCardAccount, writeCardAccount } = useMyCardAccountTools();
  const { writeMoneyPlan } = useMyMoneyPlanTools();

  const { calcRowsFromCardTerm } = useSimulatorRows();

  useEffect(() => {
    setDraftTimestamp(Date.now());
  }, []);

  const rows = useMemo(() => {
    if (!cardSnapshotList) {
      return null;
    }

    const res = calcRowsFromCardTerm({
      cardId,
      snapshotList: cardSnapshotList,
      termStart: monthCursor.minTimestamp,
      termEnd: monthCursor.maxTimestamp,
      planList
    });
    return res.rows;
  }, [
    calcRowsFromCardTerm,
    cardId,
    cardSnapshotList,
    monthCursor.maxTimestamp,
    monthCursor.minTimestamp,
    planList
  ]);

  const handleCreateCardSnapshot = useCallback(
    (v: CardSnapshot) => {
      clearPopup();
      return runAsyncHandler(() => createCardSnapshot(v));
    },
    [clearPopup, createCardSnapshot, runAsyncHandler]
  );

  const handleUpdateCardSnapshot = useCallback(
    async (v: CardSnapshot) => {
      if (popup?.type !== "edit-card-snapshot") {
        return null;
      }
      clearPopup();
      const { snapshotId } = popup;
      return runAsyncHandler(() => writeCardSnapshot(snapshotId, v));
    },
    [clearPopup, popup, runAsyncHandler, writeCardSnapshot]
  );

  const handleDeletePopupSnapshot = useCallback(async () => {
    if (popup?.type !== "edit-card-snapshot") {
      return null;
    }
    clearPopup();
    const { snapshotId } = popup;
    return runAsyncHandler(() => deleteCardSnapshot(snapshotId));
  }, [clearPopup, deleteCardSnapshot, popup, runAsyncHandler]);

  const handleUpdateCardAccount = useCallback(
    (v: MoneyCardAccount) => {
      if (popup?.type !== "edit-card-account") {
        return null;
      }
      clearPopup();
      const { cardId: id } = popup;
      return runAsyncHandler(() => writeCardAccount(id, v));
    },
    [clearPopup, popup, runAsyncHandler, writeCardAccount]
  );

  const handleCreateCardAccount = useCallback(
    (v: MoneyCardAccount) => {
      if (popup?.type !== "create-card-account") {
        return null;
      }
      clearPopup();
      return runAsyncHandler(() => createCardAccount(v));
    },
    [clearPopup, createCardAccount, popup?.type, runAsyncHandler]
  );

  const handleUpdatePlan = useCallback(
    (v: MoneyPlan) => {
      if (popup?.type !== "edit-plan") {
        return null;
      }
      clearPopup();
      const { planId } = popup;
      return runAsyncHandler(() => writeMoneyPlan(planId, v));
    },
    [clearPopup, popup, runAsyncHandler, writeMoneyPlan]
  );

  const createCardSnapshotDraft = useCallback(() => {
    if (
      !cardSnapshotList ||
      !rows ||
      draftTimestamp < monthCursor.minTimestamp
    ) {
      return;
    }

    let timestamp = draftTimestamp;

    if (timestamp >= monthCursor.maxTimestamp) {
      const d = new Date(monthCursor.maxTimestamp);
      d.setMinutes(d.getMinutes() - 1);
      timestamp = d.getTime();
    }

    const [firstSnapshotPair] = cardSnapshotList;
    const diffSnapshot = firstSnapshotPair ? firstSnapshotPair.data : null;

    const detail: CardSnapshot["detail"] = rows
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

    addPopup({
      type: "create-card-snapshot",
      defaultValue: {
        cardId,
        amount,
        timestamp,
        detail
      }
    });
  }, [
    cardId,
    cardSnapshotList,
    draftTimestamp,
    monthCursor.maxTimestamp,
    monthCursor.minTimestamp,
    rows,
    addPopup
  ]);

  const handleRowClick = useCallback(
    (action: SimulatorRow["source"]) => {
      if (action?.type === "snapshot") {
        if (!cardSnapshotList) {
          return;
        }
        const m = cardSnapshotList.find(p => p.id === action.snapshotId);
        if (!m) {
          return;
        }
        addPopup({
          type: "edit-card-snapshot",
          snapshotId: action.snapshotId,
          defaultValue: m.data
        });
      } else if (action?.type === "plan") {
        const m = planList.find(p => p.id === action.planId);
        if (!m) {
          return;
        }
        addPopup({
          type: "edit-plan",
          planId: action.planId,
          defaultValue: m.data
        });
      }
    },
    [cardSnapshotList, planList, addPopup]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return (
    <>
      <div>
        <p>カード</p>
        {cardList.map(({ id, data }) =>
          id === cardId ? (
            <p key={id}>
              <MockActionButton
                action={{
                  type: "button",
                  onClick: () => addPopup({ type: "select-card" })
                }}
              >
                {data.label}
              </MockActionButton>
            </p>
          ) : null
        )}
      </div>
      <MonthCursorNavi monthCursor={monthCursor} />
      {draftTimestamp >= monthCursor.minTimestamp ? (
        <p>
          <MockActionButton
            action={{
              type: "button",
              onClick: createCardSnapshotDraft
            }}
          >
            ログ追加
          </MockActionButton>
        </p>
      ) : null}
      {rows ? (
        <SimulatorTableView
          rows={rows}
          lastSnapshot={null}
          onClickRow={handleRowClick}
        />
      ) : null}
      {popup?.type === "create-card-snapshot" ? (
        <CardSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onClose={closeCurrentPopup}
          onSubmit={handleCreateCardSnapshot}
        />
      ) : null}
      {popup?.type === "edit-card-snapshot" ? (
        <CardSnapshotFormPopup
          defaultValue={popup.defaultValue}
          onSubmit={handleUpdateCardSnapshot}
          onDelete={handleDeletePopupSnapshot}
          onClose={closeCurrentPopup}
        />
      ) : null}
      {popup?.type === "edit-plan" ? (
        <PlanFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankList}
          cardList={cardList}
          onClose={closeCurrentPopup}
          onSubmit={handleUpdatePlan}
        />
      ) : null}
      {popup?.type === "select-card" ? (
        <CardSelectPopup
          defaultValue={cardId}
          cardList={cardList}
          onDetail={(id, data) =>
            addPopup({
              type: "edit-card-account",
              cardId: id,
              defaultValue: data
            })
          }
          onCreate={order =>
            addPopup({
              type: "create-card-account",
              defaultValue: parseMoneyCardAccount({ order })
            })
          }
          onClose={closeCurrentPopup}
          onSubmit={onChangeCard}
        />
      ) : null}
      {popup?.type === "edit-card-account" ? (
        <CardAccountFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankList}
          onSubmit={handleUpdateCardAccount}
          onClose={closeCurrentPopup}
        />
      ) : null}
      {popup?.type === "create-card-account" ? (
        <CardAccountFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankList}
          onSubmit={handleCreateCardAccount}
          onClose={closeCurrentPopup}
        />
      ) : null}
      {isLoading ? <MockLoadingPopup /> : null}
      {operationError ? (
        <ErrorPopup
          error={operationError}
          onClose={() => setOperationError(null)}
        />
      ) : null}
    </>
  );
};

export default CardSnapshotListScene;
