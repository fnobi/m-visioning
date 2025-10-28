import PageEntry from "~/common/lib/PageEntry";
import { BASE_URL } from "~/common/lib/constants";

const PAGE_ROOT = new PageEntry(BASE_URL);

export const PAGE_TOP = PAGE_ROOT;
export const PAGE_PLAN_LIST = PAGE_ROOT.child("plan-list");
export const PAGE_BANK_SNAPSHOT_LIST = PAGE_ROOT.child<never, { bank: string }>(
  "bank-snapshot-list"
);
export const PAGE_CARD_SNAPSHOT_LIST = PAGE_ROOT.child<
  never,
  { card: string; month: string }
>("card-snapshot-list");
