import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import styled from "@emotion/styled";
import { compact, makeArray, maxBy, uniqBy } from "~/common/lib/array-util";
import { em, percent } from "~/common/lib/css-util";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { formatDateLabel } from "~/common/lib/date-util";
import MockActionButton from "~/common/components/MockActionButton";
import { parseString } from "~/common/lib/parser-helper";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { THEME_COLOR } from "~/app/lib/emotion-mixin";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import { type FromMoneyNode, type ToMoneyNode } from "~/app/scheme/MoneyPlan";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import { parseBankSnapshot } from "~/app/scheme/BankSnapshot";

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
  calcDayArray(st, (end - st) / (1000 * 60 * 60 * 24));

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

const checkIsAfter = (
  b: { year: number; month: number; day: number },
  a: { year: number; month: number; day: number }
) =>
  (b.year * 100 + b.month) * 100 + b.day <=
  (a.year * 100 + a.month) * 100 + a.day;

const TableCell = styled.p<{ isArchive: boolean; align?: "left" | "right" }>(
  ({ isArchive, align = "left" }) => ({
    opacity: isArchive ? 0.5 : 1,
    textAlign: align
  })
);

const BankTableScene = ({
  bankId,
  currentBank,
  cardTerms,
  baseDate,
  periodLength,
  planList,
  bankSnapshotList,
  lastBankSnapshot,
  graphMode,
  onCreateBankSnapshot,
  onCreateCardSnapshot
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
  baseDate: number;
  periodLength: number;
  planList: TypedCollectionList<MoneyPlan>;
  bankSnapshotList: TypedCollectionList<BankSnapshot>;
  lastBankSnapshot: BankSnapshot | null;
  graphMode: boolean;
  onCreateBankSnapshot: (v: BankSnapshot) => void;
  onCreateCardSnapshot: (v: CardSnapshot) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calcRows = useCallback(
    ({
      startDate,
      daysCount,
      baseAmount,
      snapshotList,
      nodeFilter,
      sourcePlanList
    }: {
      startDate: number;
      daysCount: number;
      baseAmount: number;
      snapshotList: TypedCollectionList<BankSnapshot | CardSnapshot>;
      // TODO: cardId/bankIdで絞り込み済みのplanListを渡すようにして、1個にまとめたい
      nodeFilter: FromMoneyNode;
      sourcePlanList: TypedCollectionList<MoneyPlan>;
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

      let amount = baseAmount;
      let minDate = 0;
      const rows = [...snapshotList]
        .reverse()
        .map(({ id, data }) => {
          let cache = amount;
          amount = data.amount;
          minDate = Math.max(minDate, data.timestamp);

          const array: {
            id: string;
            date: number;
            label: string;
            amount: number;
            price: number;
            isArchive: boolean;
          }[] = [];

          parseBankSnapshot(data).detail.forEach((d, i) => {
            cache += d.price;
            array.push({
              id: `${id}-${i}`,
              date: d.date,
              label: d.label,
              price: d.price,
              amount: cache,
              isArchive: true
            });
          });

          if (amount !== cache) {
            array.push({
              id,
              date: data.timestamp,
              label: "不明",
              amount,
              price: amount - cache,
              isArchive: true
            });
          }

          return array;
        })
        .flat();

      calcDayArray(startDate, daysCount).forEach(cdata => {
        const { date, year: cy, month: cm, day: cd } = cdata;
        if (minDate >= date) {
          return;
        }
        sourcePlanList2.forEach(({ id, data }) => {
          const { year, month, day, label, price, repeat } = data;
          const validRepeat = checkIsAfter(data, cdata) ? repeat : null;
          const flag =
            (year === cy || validRepeat) &&
            (month === cm || validRepeat === "month") &&
            day === cd;
          if (!flag) {
            return;
          }

          amount += price;
          rows.push({ id, date, label, amount, price, isArchive: false });
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
            baseAmount: 0,
            snapshotList,
            startDate: termStart,
            daysCount: (termEnd - termStart) / (1000 * 60 * 60 * 24),
            nodeFilter: { type: "card", cardId },
            sourcePlanList: planList
          });
          return { key, year, month, day, label, amount };
        }
      ),
    [calcRows, cardTerms, planList]
  );

  const bankEvents = useMemo(() => {
    const cardPaymentPlanList = cardAmount.map<{
      id: string;
      data: MoneyPlan;
    }>(({ key, year, month, day, label, amount }) => ({
      id: key,
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
        }
      }
    }));
    return calcRows({
      baseAmount: lastBankSnapshot ? lastBankSnapshot.amount : 0,
      snapshotList: bankSnapshotList,
      startDate: baseDate,
      daysCount: periodLength,
      nodeFilter: { type: "bank", bankId },
      sourcePlanList: [...planList, ...cardPaymentPlanList]
    });
  }, [
    bankId,
    lastBankSnapshot,
    bankSnapshotList,
    baseDate,
    calcRows,
    cardAmount,
    periodLength,
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

      onCreateBankSnapshot({
        bankId,
        amount,
        timestamp,
        detail
      });
    };
  }, [
    bankEvents.rows,
    bankId,
    bankSnapshotList,
    lastBankSnapshot,
    onCreateBankSnapshot
  ]);

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
        baseAmount: 0,
        snapshotList: terms.snapshotList,
        startDate: terms.termStart,
        daysCount: (terms.termEnd - terms.termStart) / (1000 * 60 * 60 * 24),
        nodeFilter: { type: "card", cardId },
        sourcePlanList: planList
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

      onCreateCardSnapshot({
        cardId,
        amount,
        timestamp,
        detail
      });
    },
    [calcRows, cardTerms, onCreateCardSnapshot, planList]
  );

  useEffect(() => {
    const { current: canvas } = canvasRef;
    if (!canvas || !graphMode) {
      return;
    }
    const PADDING = 50;
    canvas.width = 800;
    canvas.height = 600;
    const contentWidth = canvas.width - PADDING * 2;
    const contentHeight = canvas.height - PADDING;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(PADDING, PADDING);

      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(0, 0, contentWidth, contentHeight);

      const vlines: number[] = [];
      const vdate = new Date(baseDate);
      const endDate = new Date(baseDate + periodLength * (1000 * 60 * 60 * 24));
      while (vdate < endDate) {
        vdate.setDate(1);
        vlines.push(vdate.getTime());
        vdate.setMonth(vdate.getMonth() + 1);
      }
      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      vlines.forEach((v, i) => {
        const isOdd = i % 2;
        const progress =
          (v - baseDate) / (periodLength * (1000 * 60 * 60 * 24));
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
      const points = bankEvents.rows.map(r => {
        const progress =
          (r.date - baseDate) / (periodLength * (1000 * 60 * 60 * 24));
        const x = contentWidth * progress;
        const y = contentHeight * (1 - r.amount / maxAmount);
        return { x, y };
      });

      ctx.fillStyle = THEME_COLOR.DARK;
      ctx.beginPath();
      points.forEach(({ x, y }) => {
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

      vlines.forEach(v => {
        const progress =
          (v - baseDate) / (periodLength * (1000 * 60 * 60 * 24));
        ctx.font = "30px/30px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          parseString(new Date(v).getMonth() + 1),
          contentWidth * progress,
          -5
        );
      });
    }
  }, [bankEvents, baseDate, graphMode, periodLength]);

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
            <TableCell isArchive>
              {formatDateLabel(lastBankSnapshot.timestamp)}
            </TableCell>
            <TableCell isArchive>現在の残高</TableCell>
            <TableCell isArchive />
            <TableCell isArchive align="right">
              {lastBankSnapshot.amount}
            </TableCell>
          </>
        ) : null}
        {bankEvents.rows.map(
          ({ date, id, label, price, amount, isArchive }) => (
            <Fragment key={[date, id].join("_")}>
              <TableCell isArchive={isArchive}>
                {formatDateLabel(date)}
              </TableCell>
              <TableCell isArchive={isArchive}>{label}</TableCell>
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
