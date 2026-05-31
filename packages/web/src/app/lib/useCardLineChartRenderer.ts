import { useEffect, useRef } from "react";
import { sortBy } from "~/common/lib/array-util";
import { type SimulatorRow } from "~/app/lib/useSimulatorRows";
import { THEME_COLOR } from "~/app/lib/emotion-mixin";

const toPoints = (
  rows: SimulatorRow[],
  startDate: number
): { date: number; amount: number }[] => {
  const sorted = sortBy(rows, r => r.date);
  return [
    { date: startDate, amount: 0 },
    ...sorted.map(r => ({ date: r.date, amount: -r.amount }))
  ];
};

const drawSeries = (
  ctx: CanvasRenderingContext2D,
  points: { date: number; amount: number }[],
  color: string,
  startDate: number,
  endDate: number,
  contentWidth: number,
  contentHeight: number,
  ceilAmount: number
) => {
  const range = endDate - startDate;
  const mapped = points.map(p => ({
    x: contentWidth * ((p.date - startDate) / range),
    y: contentHeight * (1 - Math.max(0, p.amount / ceilAmount))
  }));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  mapped.forEach(({ x, y }) => {
    ctx.moveTo(x, y);
    ctx.arc(x, y, 2, 0, Math.PI * 2);
  });
  ctx.fill();

  ctx.beginPath();
  mapped.forEach(({ x, y }, i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
};

const useCardLineChartRenderer = ({
  isActive,
  startDate,
  endDate,
  actualRows,
  planRows
}: {
  isActive: boolean;
  startDate: number;
  endDate: number;
  actualRows: SimulatorRow[];
  planRows: SimulatorRow[];
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { current: canvas } = canvasRef;
    if (!canvas || !isActive) return;

    const PADDING_LEFT = 75;
    const PADDING_RIGHT = 40;
    const PADDING_Y = 55;
    const WIDTH = 800;
    const HEIGHT = 600;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = (HEIGHT / WIDTH) * canvas.width;

    const contentWidth = WIDTH - (PADDING_LEFT + PADDING_RIGHT);
    const contentHeight = HEIGHT - PADDING_Y * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(canvas.width / WIDTH, canvas.width / WIDTH);
    ctx.translate(PADDING_LEFT, PADDING_Y);

    const actualPoints = toPoints(actualRows, startDate);
    const planPoints = toPoints(planRows, startDate);

    const maxAmount = Math.max(
      0,
      ...actualPoints.map(p => p.amount),
      ...planPoints.map(p => p.amount)
    );

    let hUnit = 10;
    while (maxAmount / (hUnit * 10) > 1) hUnit *= 10;
    const ceilAmount = Math.ceil(maxAmount / hUnit) * hUnit;

    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, contentWidth, contentHeight);

    if (ceilAmount === 0) return;

    const hLines: number[] = [];
    for (let r = hUnit; r < ceilAmount; r += hUnit) hLines.push(r);

    const vlines: number[] = [];
    const vdate = new Date(startDate);
    const edate = new Date(endDate);
    while (vdate < edate) {
      vdate.setDate(1);
      vlines.push(vdate.getTime());
      vdate.setMonth(vdate.getMonth() + 1);
    }
    vlines.push(endDate);

    ctx.save();
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    hLines.forEach(r => {
      const y = contentHeight * (1 - r / ceilAmount);
      ctx.moveTo(0, y);
      ctx.lineTo(contentWidth, y);
    });
    vlines.forEach(v => {
      const x = contentWidth * ((v - startDate) / (endDate - startDate));
      ctx.moveTo(x, 0);
      ctx.lineTo(x, contentHeight);
    });
    ctx.stroke();
    ctx.restore();

    drawSeries(
      ctx,
      planPoints,
      THEME_COLOR.WAVE_YELLOW,
      startDate,
      endDate,
      contentWidth,
      contentHeight,
      ceilAmount
    );
    drawSeries(
      ctx,
      actualPoints,
      THEME_COLOR.DARK,
      startDate,
      endDate,
      contentWidth,
      contentHeight,
      ceilAmount
    );

    ctx.font = "12px/12px sans-serif";
    ctx.fillStyle = THEME_COLOR.DARK;

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    hLines.forEach(r => {
      const y = contentHeight * (1 - r / ceilAmount);
      ctx.fillText(`¥${r.toLocaleString()}`, -5, y);
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    vlines.forEach(v => {
      const x = contentWidth * ((v - startDate) / (endDate - startDate));
      const d = new Date(v);
      const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
      ctx.save();
      ctx.translate(x, -5);
      ctx.rotate((-1 / 4) * Math.PI);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    const LEGEND_X = contentWidth - 160;
    const LEGEND_Y = 8;
    const LEGEND_ROW_H = 18;

    ctx.font = "11px/11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = THEME_COLOR.DARK;
    ctx.fillRect(LEGEND_X, LEGEND_Y, 12, 12);
    ctx.fillText("実績+予測", LEGEND_X + 16, LEGEND_Y + 6);

    ctx.fillStyle = THEME_COLOR.WAVE_YELLOW;
    ctx.fillRect(LEGEND_X, LEGEND_Y + LEGEND_ROW_H, 12, 12);
    ctx.fillStyle = THEME_COLOR.DARK;
    ctx.fillText("プランのみ", LEGEND_X + 16, LEGEND_Y + LEGEND_ROW_H + 6);
  }, [isActive, startDate, endDate, actualRows, planRows]);

  return { canvasRef };
};

export default useCardLineChartRenderer;
