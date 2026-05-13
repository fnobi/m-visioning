export const SPENDING_CATEGORIES = [
  { value: "food", label: "食費" },
  { value: "transport", label: "交通費" },
  { value: "entertainment", label: "娯楽" },
  { value: "daily", label: "日用品" },
  { value: "fashion", label: "衣服・美容" },
  { value: "medical", label: "医療" },
  { value: "utility", label: "光熱費" },
  { value: "travel", label: "旅行・デート" },
  { value: "subscription", label: "サブスク" },
  { value: "other", label: "その他" }
] as const;

export type SpendingCategoryValue =
  (typeof SPENDING_CATEGORIES)[number]["value"];

const CATEGORY_COLORS: Record<string, string> = {
  food: "#FF6384",
  transport: "#36A2EB",
  entertainment: "#FFCE56",
  daily: "#4BC0C0",
  fashion: "#9966FF",
  medical: "#FF9F40",
  utility: "#C9CBCF",
  travel: "#F97316",
  subscription: "#8B5CF6",
  other: "#AAAAAA",
  "": "#DDDDDD"
};

export const getCategoryLabel = (value: string): string =>
  SPENDING_CATEGORIES.find(c => c.value === value)?.label ?? "未分類";

export const getCategoryColor = (value: string): string =>
  CATEGORY_COLORS[value] ?? CATEGORY_COLORS[""];
