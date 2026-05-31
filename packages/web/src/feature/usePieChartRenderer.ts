import { useEffect, useRef } from "react";
import { sumBy } from "@m-visioning/core/util/array-util";
import {
  getCategoryColor,
  getCategoryLabel
} from "@m-visioning/core/schema/SpendingCategory";
import { THEME_COLOR } from "~/feature//emotion-mixin";

const usePieChartRenderer = ({
  isActive,
  items
}: {
  isActive: boolean;
  items: { category: string; amount: number }[];
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const { current: canvas } = canvasRef;
    if (!canvas || !isActive || items.length === 0) {
      return;
    }

    const WIDTH = 500;
    const HEIGHT = 300;
    const PIE_CX = 130;
    const PIE_CY = HEIGHT / 2;
    const RADIUS = 100;
    const LEGEND_X = PIE_CX + RADIUS + 30;
    const LEGEND_ROW_H = 26;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = (HEIGHT / WIDTH) * canvas.width;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.scale(canvas.width / WIDTH, canvas.width / WIDTH);

    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const total = items.reduce((s, i) => s + i.amount, 0);
    if (total === 0) {
      return;
    }

    // 円グラフ描画
    let angle = -Math.PI / 2;
    items.forEach(item => {
      const slice = (item.amount / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(PIE_CX, PIE_CY);
      ctx.arc(PIE_CX, PIE_CY, RADIUS, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = getCategoryColor(item.category);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      angle += slice;
    });

    // 凡例描画
    ctx.font = "12px/12px sans-serif";
    items.forEach((item, i) => {
      const y = 20 + i * LEGEND_ROW_H;
      const pct = Math.round((item.amount / total) * 100);

      ctx.fillStyle = getCategoryColor(item.category);
      ctx.fillRect(LEGEND_X, y, 14, 14);

      ctx.fillStyle = THEME_COLOR.DARK;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${getCategoryLabel(
          item.category
        )}  ¥${item.amount.toLocaleString()}  (${pct}%)`,
        LEGEND_X + 20,
        y + 1
      );
    });
    ctx.fillText(
      `合計  ¥${sumBy(
        Object.values(items),
        ({ amount }) => amount
      ).toLocaleString()}`,
      LEGEND_X + 20,
      20 + items.length * LEGEND_ROW_H
    );
  }, [isActive, items]);

  return { canvasRef };
};

export default usePieChartRenderer;
