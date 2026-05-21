import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "m-visioning-mcp",
  version: "0.1.0"
});

// ツール1: 今日の日付
server.tool(
  "get_current_date",
  "今日の日付を返す",
  {},
  async () => {
    const text = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
    return { content: [{ type: "text" as const, text }] };
  }
);

// ツール2: 支出リストの集計
// 将来的には実際のMoneyPlanデータで置き換えるイメージ
server.tool(
  "sum_expenses",
  "支出アイテムのリストを受け取り、合計と内訳を返す",
  {
    items: z
      .array(
        z.object({
          label: z.string().describe("支出名"),
          amount: z.number().describe("金額（円）")
        })
      )
      .describe("支出アイテムのリスト")
  },
  async ({ items }) => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const breakdown = items
      .map(item => `  - ${item.label}: ¥${item.amount.toLocaleString("ja-JP")}`)
      .join("\n");
    const text = [
      `合計支出: ¥${total.toLocaleString("ja-JP")}`,
      "",
      "内訳:",
      breakdown
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

// ツール3: サンプルMoneyPlan一覧（ダミーデータ）
// 将来的にはFirestoreから実データを取得する
server.tool(
  "list_sample_plans",
  "サンプルのMoneyPlan一覧を返す（デモ用固定データ）",
  {
    year: z.number().describe("年"),
    month: z.number().min(1).max(12).describe("月（1〜12）")
  },
  async ({ year, month }) => {
    const plans = [
      { label: "家賃", price: -80000, day: 1, repeat: "month", category: "住居" },
      { label: "電気代", price: -8000, day: 15, repeat: "month", category: "光熱費" },
      { label: "給与", price: 300000, day: 25, repeat: "month", category: "収入" },
      { label: "スーパー", price: -30000, day: 10, repeat: null, category: "食費" }
    ];

    const rows = plans.map(p => {
      const sign = p.price >= 0 ? "+" : "";
      const repeatLabel = p.repeat === "month" ? "（毎月）" : "";
      return `  [${p.category}] ${p.label}: ${sign}¥${p.price.toLocaleString("ja-JP")}　${month}/${p.day}${repeatLabel}`;
    });

    const total = plans.reduce((sum, p) => sum + p.price, 0);
    const totalSign = total >= 0 ? "+" : "";

    const text = [
      `${year}年${month}月 のMoneyPlan一覧（サンプル）:`,
      ...rows,
      "",
      `収支合計: ${totalSign}¥${total.toLocaleString("ja-JP")}`
    ].join("\n");

    return { content: [{ type: "text" as const, text }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
