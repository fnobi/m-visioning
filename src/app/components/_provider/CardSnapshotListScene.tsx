import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import MockActionButton from "~/common/components/MockActionButton";
import usePopupOperation from "~/common/lib/usePopupOperation";
import { percent } from "~/common/lib/css-util";
import PickableTitle from "~/app/components/PickableTitle";
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
import useMonthCursor from "~/app/lib/useMonthCursor";
import useSimulatorRows, {
  type SimulatorRow
} from "~/app/lib/useSimulatorRows";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import useAsyncHandler from "~/app/lib/useAsyncHandler";
import { parseMoneyCardAccount } from "~/app/scheme/MoneyCardAccount";
import useMyMoneyStore from "~/app/lib/database/useMyMoneyStore";
import usePieChartRenderer from "~/app/lib/usePieChartRenderer";

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
  monthCode,
  graphMode,
  onChangeCard,
  onChangeMonth,
  setGraph
}: {
  cardId: string | null;
  monthCode: number;
  graphMode: boolean;
  onChangeCard: (id: string) => void;
  onChangeMonth: (v: number) => void;
  setGraph: (v: boolean) => void;
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

  const {
    cardAccountList,
    bankAccountList,
    moneyPlanList,
    createCardAccount,
    writeCardAccount,
    writeMoneyPlan
  } = useMyMoneyStore();
  const currentCard = useMemo(() => {
    const matched = (cardAccountList || []).find(b => b.id === cardId);
    return matched ? matched.data : null;
  }, [cardId, cardAccountList]);
  const monthCursor = useMonthCursor({
    monthCode,
    setMonthCode: onChangeMonth,
    startDay: currentCard ? currentCard.startDay : 0
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

  const { calcRowsFromCardTerm } = useSimulatorRows();

  useEffect(() => {
    setDraftTimestamp(Date.now());
  }, []);

  const rows = useMemo(() => {
    if (!cardId || !cardSnapshotList || !moneyPlanList) {
      return null;
    }

    const res = calcRowsFromCardTerm({
      cardId,
      snapshotList: cardSnapshotList,
      termStart: monthCursor.minTimestamp,
      termEnd: monthCursor.maxTimestamp,
      planList: moneyPlanList
    });
    return res.rows;
  }, [
    calcRowsFromCardTerm,
    cardId,
    cardSnapshotList,
    moneyPlanList,
    monthCursor.maxTimestamp,
    monthCursor.minTimestamp
  ]);

  const categoryItems = useMemo(() => {
    if (!cardSnapshotList) {
      return [];
    }
    let lastAmount = 0;
    let categorizedAmount = 0;
    const totals: Record<string, number> = {};
    cardSnapshotList.forEach(({ data }) => {
      data.detail.forEach(({ category, price }) => {
        const key = category || "";
        const absPrice = -price;
        totals[key] = (totals[key] ?? 0) + absPrice;
        if (key) {
          categorizedAmount += absPrice;
        }
      });
      lastAmount = lastAmount || -data.amount;
    });
    totals[""] = (totals[""] ?? 0) + lastAmount - categorizedAmount;
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .filter(i => i.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [cardSnapshotList]);

  const { canvasRef } = usePieChartRenderer({
    isActive: graphMode && categoryItems.length > 0,
    items: categoryItems
  });

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
      !cardId ||
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
        date: r.date,
        category: ""
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
        const m = (moneyPlanList || []).find(p => p.id === action.planId);
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
    [cardSnapshotList, addPopup, moneyPlanList]
  );

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  if (!currentCard) {
    return <p>loading...</p>;
  }

  return (
    <>
      {cardId ? (
        <PickableTitle
          type="card"
          onOpen={() => addPopup({ type: "select-card" })}
          onEdit={() =>
            addPopup({
              type: "edit-card-account",
              cardId,
              defaultValue: currentCard
            })
          }
        >
          {currentCard.label}
        </PickableTitle>
      ) : null}
      <MonthCursorNavi monthCursor={monthCursor} />
      {cardSnapshotList ? (
        <>
          <p>
            <label>
              <input
                type="checkbox"
                checked={graphMode}
                onChange={e => setGraph(e.target.checked)}
              />
              graph
            </label>
          </p>
          {graphMode ? (
            <canvas
              ref={canvasRef}
              style={{ width: percent(100), height: "auto" }}
            />
          ) : (
            <>
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
            </>
          )}
        </>
      ) : (
        <div>loading...</div>
      )}
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
          bankList={bankAccountList}
          cardList={cardAccountList}
          onClose={closeCurrentPopup}
          onSubmit={handleUpdatePlan}
        />
      ) : null}
      {popup?.type === "select-card" ? (
        <CardSelectPopup
          defaultValue={cardId}
          cardList={cardAccountList}
          onCreate={v =>
            addPopup({
              type: "create-card-account",
              defaultValue: parseMoneyCardAccount(v)
            })
          }
          onClose={closeCurrentPopup}
          onSubmit={onChangeCard}
        />
      ) : null}
      {popup?.type === "edit-card-account" ? (
        <CardAccountFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankAccountList}
          onSubmit={handleUpdateCardAccount}
          onClose={closeCurrentPopup}
        />
      ) : null}
      {popup?.type === "create-card-account" ? (
        <CardAccountFormPopup
          defaultValue={popup.defaultValue}
          bankList={bankAccountList}
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
