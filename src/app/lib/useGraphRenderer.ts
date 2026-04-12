import { useEffect, useRef } from "react";
import { maxBy } from "~/common/lib/array-util";
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
    const PADDING_X = 40;
    const PADDING_Y = 55;
    const WIDTH = 800;
    const HEIGHT = 600;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = (HEIGHT / WIDTH) * canvas.width;

    const contentWidth = WIDTH - PADDING_X * 2;
    const contentHeight = HEIGHT - PADDING_Y * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(canvas.width / WIDTH, canvas.width / WIDTH);

      ctx.translate(PADDING_X, PADDING_Y);

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
      vlines.push(endDate);
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

      ctx.font = "12px/12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";

      for (let i = 0; i < vlines.length; i += 1) {
        const st = vlines[i];
        const en = vlines[i + 1];
        const stp = (st - startDate) / (endDate - startDate);
        const enp = (en - startDate) / (endDate - startDate);
        const rangePoints = points.filter(
          p => p.x >= contentWidth * stp && p.x < contentWidth * enp
        );

        const d = new Date(st);
        const label = [d.getFullYear(), d.getMonth() + 1].join("/");
        ctx.save();
        ctx.translate(contentWidth * stp, -5);
        ctx.rotate((-1 / 4) * Math.PI);
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (rangePoints.length) {
          const minPoint = rangePoints.reduce(
            (prev, curr) => (curr.amount < prev.amount ? curr : prev),
            { x: 0, y: 0, amount: Infinity }
          );
          ctx.save();
          ctx.textAlign = "right";
          ctx.textBaseline = "top";
          ctx.fillStyle = minPoint.amount > 0 ? THEME_COLOR.DARK : "#ff0000";
          ctx.translate(minPoint.x, contentHeight);
          ctx.rotate((-1 / 4) * Math.PI);
          ctx.fillText(`¥${minPoint.amount.toLocaleString()}`, 0, 0);
          ctx.restore();
        }
      }
    }
  }, [bankEvents, startDate, endDate, isActive]);

  return { canvasRef };
};

export default useGraphRenderer;
