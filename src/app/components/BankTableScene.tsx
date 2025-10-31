import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import styled from "@emotion/styled";
import { compact, makeArray, maxBy, uniqBy } from "~/common/lib/array-util";
import { em, percent } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import MockActionButton from "~/common/components/MockActionButton";
import { parseString } from "~/common/lib/parser-helper";
import type CommonActionParameter from "~/common/scheme/CommonActionParameter";
import { PAGE_CARD_SNAPSHOT_LIST } from "~/app/lib/page-path";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { THEME_COLOR } from "~/app/lib/emotion-mixin";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import { parseBankSnapshot } from "~/app/scheme/BankSnapshot";

type BankRow = {
  id: string;
  date: number;
  label: string;
  amount: number;
  price: number;
  isArchive: boolean;
  action:
    | { type: "plan"; planId: string }
    | {
        type: "bank-snapshot";
        snapshotId: string;
      }
    | {
        type: "card-table";
        cardId: string;
        monthCode: number;
      }
    | null;
};

export type PopupParams =
  | {
      type: "create-bank-snapshot";
      defaultValue: BankSnapshot;
    }
  | {
      type: "create-card-snapshot";
      defaultValue: CardSnapshot;
    }
  | {
      type: "edit-bank-snapshot";
      snapshotId: string;
      defaultValue: BankSnapshot;
    }
  | {
      type: "edit-plan";
      planId: string;
      defaultValue: MoneyPlan;
    };

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

export const calcRangeDayArray = (st: number, end: number) =>
  calcDayArray(st, Math.floor((end - st) / (1000 * 60 * 60 * 24)));

export const matchMoneyNode = (
  n1: FromMoneyNode | ToMoneyNode,
  n2: FromMoneyNode | ToMoneyNode
) => {
  if (n1.type === "bank") {
    return n2.type === "bank" && n1.bankId === n2.bankId;
  }
  if (n1.type === "card") {
    return n2.type === "card" && n1.cardId === n2.cardId;
  }
  if (n1.type === "input") {
    return n2.type === "input";
  }
  if (n1.type === "output") {
    return n2.type === "output";
  }
  return false;
};

const calcMonthCode = (d: { year: number; month: number }) =>
  d.year * 100 + d.month;

export const calcDateParamInt = (d: {
  year: number;
  month: number;
  day: number;
}) => calcMonthCode(d) * 100 + d.day;

const calcCardStartMonthCode = ({
  year,
  month,
  day
}: {
  year: number;
  month: number;
  day: number;
}) => {
  const d = new Date(year, month - 1, day);
  d.setMonth(d.getMonth() - 2);
  return calcMonthCode({ year: d.getFullYear(), month: d.getMonth() + 1 });
};

export const calcDateInt = (d: Date) =>
  calcDateParamInt({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  });

const checkIsAfter = (
  b: { year: number; month: number; day: number },
  a: { year: number; month: number; day: number }
) => calcDateParamInt(b) <= calcDateParamInt(a);

const TableCell = styled.p<{ isArchive: boolean; align?: "left" | "right" }>(
  ({ isArchive, align = "left" }) => ({
    opacity: isArchive ? 0.5 : 1,
    textAlign: align
  })
);

const useGraphRenderer = ({
  isActive,
  startDate,
  endDate,
  bankEvents
}: {
  isActive: boolean;
  startDate: number;
  endDate: number;
  bankEvents: {
    rows: BankRow[];
  };
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { current: canvas } = canvasRef;
    if (!canvas || !isActive) {
      return;
    }
    const PADDING = 50;
    canvas.width = 800;
    canvas.height = 600;
    const contentWidth = canvas.width - PADDING * 2;
    const contentHeight = canvas.height - PADDING * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(PADDING, PADDING);

      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(0, 0, contentWidth, contentHeight);

      const vlines: number[] = [];
      const vdate = new Date(startDate);
      const edate = new Date(endDate);
      while (vdate < edate) {
        vdate.setDate(1);
        vlines.push(vdate.getTime());
        vdate.setMonth(vdate.getMonth() + 1);
      }
      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      vlines.forEach((v, i) => {
        const isOdd = i % 2;
        const progress = (v - startDate) / (endDate - startDate);
        ctx.lineTo(contentWidth * progress, isOdd ? 0 : contentHeight);
        ctx.lineTo(contentWidth * progress, isOdd ? contentHeight : 0);
      });
      const isOddLength = vlines.length % 2;
      if (isOddLength) {
        ctx.lineTo(contentWidth, 0);
      }
      ctx.lineTo(contentWidth, contentHeight);
      ctx.fill();

      const maxAmount =
        Math.ceil(maxBy(bankEvents.rows, r => r.amount) / 100000) * 100000;
      const points = bankEvents.rows.map(({ date, amount }) => {
        const progress = (date - startDate) / (endDate - startDate);
        const x = contentWidth * progress;
        const y = contentHeight * (1 - Math.max(0, amount / maxAmount));
        return { x, y, amount };
      });

      ctx.fillStyle = THEME_COLOR.DARK;
      ctx.beginPath();
      points.forEach(({ x, y }) => {
        if (y >= contentHeight) {
          return;
        }
        ctx.moveTo(x, y);
        ctx.arc(x, y, 2, 0, Math.PI * 2);
      });
      ctx.fill();

      ctx.beginPath();
      points.forEach(({ x, y }, i) => {
        if (i) {
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
      });
      ctx.stroke();

      ctx.font = "18px/18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      vlines.forEach(v => {
        const progress = (v - startDate) / (endDate - startDate);
        ctx.fillText(
          parseString(new Date(v).getMonth() + 1),
          contentWidth * progress,
          -5
        );
      });

      const minPoint = points.reduce(
        (prev, curr) => (curr.amount < prev.amount ? curr : prev),
        { x: 0, y: 0, amount: Infinity }
      );
      ctx.textBaseline = "top";
      ctx.fillStyle = minPoint.amount > 0 ? THEME_COLOR.DARK : "#ff0000";
      ctx.fillText(parseString(minPoint.amount), minPoint.x, contentHeight + 5);
    }
  }, [bankEvents, startDate, endDate, isActive]);

  return { canvasRef };
};

const BankTableScene = ({
  bankId,
  currentBank,
  cardTerms,
  startDate,
  endDate,
  planList,
  bankSnapshotList,
  lastBankSnapshot,
  graphMode,
  onPopup
}: {
  bankId: string;
  currentBank: MoneyBankAccount;
  cardTerms: {
    cardId: string;
    year: number;
    month: number;
    day: number;
    label: string;
    termStart: number;
    termEnd: number;
    snapshotList: TypedCollectionList<CardSnapshot>;
  }[];
  startDate: number;
  endDate: number;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  lastBankSnapshot: BankSnapshot | null;
  graphMode: boolean;
  onPopup: (p: PopupParams) => void;
}) => {
  const calcRows = useCallback(
    ({
      termStart,
      termEnd,
      baseSnapshot,
      snapshotList,
      nodeFilter,
      sourcePlanList
    }: {
      termStart: number;
      termEnd: number;
      baseSnapshot?: {
        amount: number;
        timestamp: number;
      };
      snapshotList: TypedCollectionList<BankSnapshot | CardSnapshot>;
      // TODO: cardId/bankIdで絞り込み済みのplanListを渡すようにして、1個にまとめたい
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<
        MoneyPlan & { cardSummary: string | null }
      >;
    }) => {
      const sourcePlanList2 = compact(
        sourcePlanList.map(pair => {
          const { id, data } = pair;
          const { from, to } = data;
          if (matchMoneyNode(to, nodeFilter)) {
            return { id, data };
          }
          if (matchMoneyNode(from, nodeFilter)) {
            return { id, data: { ...data, price: -data.price } };
          }
          return null;
        })
      );

      let amount = baseSnapshot?.amount ?? 0;
      let minDate = baseSnapshot?.timestamp ?? 0;
      const rows = [...snapshotList]
        .reverse()
        .map(({ id, data }) => {
          let cache = amount;
          amount = data.amount;
          minDate = Math.max(minDate, data.timestamp);

          const array: BankRow[] = [];

          const action: BankRow["action"] = {
            type: "bank-snapshot",
            snapshotId: id
          };

          parseBankSnapshot(data).detail.forEach((d, i) => {
            cache += d.price;
            array.push({
              id: `${id}-${i}`,
              date: d.date,
              label: d.label,
              price: d.price,
              amount: cache,
              isArchive: true,
              action
            });
          });

          if (amount !== cache) {
            array.push({
              id,
              date: data.timestamp,
              label: "不明",
              amount,
              price: amount - cache,
              isArchive: true,
              action
            });
          }

          return array;
        })
        .flat();

      calcRangeDayArray(minDate, termEnd).forEach(cdata => {
        const { date, year: cy, month: cm, day: cd } = cdata;
        sourcePlanList2.forEach(({ id, data }) => {
          const { year, month, day, label, price, repeat, cardSummary } = data;
          const validRepeat = checkIsAfter(data, cdata) ? repeat : null;
          const flag =
            (year === cy || validRepeat) &&
            (month === cm || validRepeat === "month") &&
            day === cd;
          if (!flag) {
            return;
          }

          amount += price;

          if (date < termStart) {
            return;
          }
          rows.push({
            id,
            date,
            label,
            amount,
            price,
            isArchive: false,
            action: cardSummary
              ? {
                  type: "card-table",
                  cardId: cardSummary,
                  monthCode: calcCardStartMonthCode(data)
                }
              : { type: "plan", planId: id }
          });
        });
      });

      return { rows, amount };
    },
    []
  );

  const cardAmount = useMemo(
    () =>
      cardTerms.map(
        ({
          cardId,
          year,
          month,
          day,
          label,
          termStart,
          termEnd,
          snapshotList
        }) => {
          const key = [year, month, cardId].join("_");
          const { amount } = calcRows({
            snapshotList,
            baseSnapshot: {
              timestamp: termStart,
              amount: 0
            },
            termStart,
            termEnd,
            nodeFilter: { type: "card", cardId },
            sourcePlanList: planList.map(({ id, data }) => ({
              id,
              data: { ...data, cardSummary: null }
            }))
          });
          return { key, cardId, year, month, day, label, amount };
        }
      ),
    [calcRows, cardTerms, planList]
  );

  const bankEvents = useMemo(() => {
    const cardPaymentPlanList = cardAmount.map<{
      id: string;
      data: MoneyPlan & { cardSummary: string };
    }>(({ key, cardId, year, month, day, label, amount }) => ({
      id: key,
      source: "card",
      data: {
        year,
        month,
        day,
        repeat: null,
        price: -amount,
        label,
        from: {
          type: "bank",
          bankId
        },
        to: {
          type: "output"
        },
        cardSummary: cardId
      }
    }));
    return calcRows({
      baseSnapshot: lastBankSnapshot || undefined,
      snapshotList: bankSnapshotList,
      termStart: startDate,
      termEnd: endDate,
      nodeFilter: { type: "bank", bankId },
      sourcePlanList: [
        ...planList.map(({ id, data }) => ({
          id,
          data: { ...data, cardSummary: null }
        })),
        ...cardPaymentPlanList
      ]
    });
  }, [
    cardAmount,
    calcRows,
    lastBankSnapshot,
    bankSnapshotList,
    startDate,
    endDate,
    bankId,
    planList
  ]);

  const createBankSnapshotDraft = useMemo(() => {
    if (!bankId) {
      return null;
    }
    return () => {
      const timestamp = Date.now();
      const diffSnapshot =
        bankSnapshotList && bankSnapshotList.length
          ? bankSnapshotList[0].data
          : lastBankSnapshot;

      const detail: BankSnapshot["detail"] = bankEvents.rows
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

      onPopup({
        type: "create-bank-snapshot",
        defaultValue: {
          bankId,
          amount,
          timestamp,
          detail
        }
      });
    };
  }, [bankEvents.rows, bankId, bankSnapshotList, lastBankSnapshot, onPopup]);

  const createCardSnapshotDraft = useCallback(
    (cardId: string) => {
      const timestamp = Date.now();

      const terms = cardTerms.find(
        c =>
          c.cardId === cardId &&
          timestamp >= c.termStart &&
          timestamp < c.termEnd
      );
      if (!terms) {
        return;
      }

      const res = calcRows({
        snapshotList: terms.snapshotList,
        termStart: terms.termStart,
        termEnd: terms.termEnd,
        nodeFilter: { type: "card", cardId },
        sourcePlanList: planList.map(({ id, data }) => ({
          id,
          data: { ...data, cardSummary: null }
        }))
      });

      const diffSnapshot = terms.snapshotList.length
        ? terms.snapshotList[0].data
        : null;

      const detail: CardSnapshot["detail"] = res.rows
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

      onPopup({
        type: "create-card-snapshot",
        defaultValue: {
          cardId,
          amount,
          timestamp,
          detail
        }
      });
    },
    [calcRows, cardTerms, onPopup, planList]
  );

  const { canvasRef } = useGraphRenderer({
    isActive: graphMode,
    startDate,
    endDate,
    bankEvents
  });

  const calcRowAction = useCallback(
    (action: BankRow["action"]): CommonActionParameter | null => {
      if (!action) {
        return null;
      }
      switch (action.type) {
        case "card-table":
          return {
            type: "page-link",
            page: PAGE_CARD_SNAPSHOT_LIST.withQuery({
              card: action.cardId,
              month: parseString(action.monthCode)
            })
          };
        case "bank-snapshot":
          return {
            type: "button",
            onClick: () => {
              const m = bankSnapshotList.find(p => p.id === action.snapshotId);
              if (!m) {
                return;
              }
              onPopup({
                type: "edit-bank-snapshot",
                snapshotId: action.snapshotId,
                defaultValue: m.data
              });
            }
          };
        case "plan":
          return {
            type: "button",
            onClick: () => {
              const m = planList.find(p => p.id === action.planId);
              if (!m) {
                return;
              }
              onPopup({
                type: "edit-plan",
                planId: action.planId,
                defaultValue: m.data
              });
            }
          };
        default:
          // eslint-disable-next-line no-console
          return { type: "button", onClick: () => console.log(action) };
      }
    },
    [bankSnapshotList, onPopup, planList]
  );

  if (graphMode) {
    return (
      <div>
        <canvas
          ref={canvasRef}
          style={{
            width: percent(100),
            height: "auto"
          }}
        />
      </div>
    );
  }

  return (
    <>
      <p>
        ログ追加&nbsp;
        <MockActionButton
          action={
            createBankSnapshotDraft
              ? {
                  type: "button",
                  onClick: createBankSnapshotDraft
                }
              : null
          }
        >
          {currentBank.label}
        </MockActionButton>
        {uniqBy(cardTerms, c => c.cardId).map(({ cardId, label }) => (
          <Fragment key={cardId}>
            &nbsp;
            <MockActionButton
              action={{
                type: "button",
                onClick: () => createCardSnapshotDraft(cardId)
              }}
            >
              {label}
            </MockActionButton>
          </Fragment>
        ))}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: em(4, "auto", 6, 6)
        }}
      >
        {lastBankSnapshot ? (
          <>
            <TableCell isArchive />
            <TableCell isArchive />
            <TableCell isArchive />
            <TableCell isArchive align="right">
              {lastBankSnapshot.amount}
            </TableCell>
          </>
        ) : null}
        {bankEvents.rows.map(
          ({ date, id, label, price, amount, isArchive, action }) => (
            <Fragment key={[date, id].join("_")}>
              <TableCell isArchive={isArchive}>
                {formatDateLabel(date)}
              </TableCell>
              <TableCell isArchive={isArchive}>
                <MockActionButton action={calcRowAction(action)}>
                  {label}
                </MockActionButton>
              </TableCell>
              <TableCell isArchive={isArchive} align="right">
                {price}
              </TableCell>
              <TableCell isArchive={isArchive} align="right">
                {amount}
              </TableCell>
            </Fragment>
          )
        )}
      </div>
    </>
  );
};

export default BankTableScene;
