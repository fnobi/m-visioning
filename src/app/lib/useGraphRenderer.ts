import { useEffect, useRef } from "react";
import { maxBy } from "~/common/lib/array-util";
import { parseString } from "~/common/lib/parser-helper";
import { type SimulatorRow } from "~/app/lib/useSimulatorRows";
import { THEME_COLOR } from "~/app/lib//emotion-mixin";

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
    rows: SimulatorRow[];
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

export default useGraphRenderer;
