import type BankSnapshot from "@m-visioning/core/scheme/BankSnapshot";
import type CardSnapshot from "@m-visioning/core/scheme/CardSnapshot";
import { parseCardSnapshot } from "@m-visioning/core/scheme/CardSnapshot";
import { parseBankSnapshot } from "@m-visioning/core/scheme/BankSnapshot";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import { parseMoneyBankAccount } from "@m-visioning/core/scheme/MoneyBankAccount";
import type MoneyCardAccount from "@m-visioning/core/scheme/MoneyCardAccount";
import { parseMoneyCardAccount } from "@m-visioning/core/scheme/MoneyCardAccount";
import { parseMoneyPlan } from "@m-visioning/core/scheme/MoneyPlan";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import { parseCommonPermission } from "~/common/scheme/CommonPermission";
import type CommonPermission from "~/common/scheme/CommonPermission";
import { type DataStoreScheme } from "~/common/lib/DataStoreAgent";
import type MyPageProperty from "~/app/scheme/MyPageProperty";
import { parseMyPageProperty } from "~/app/scheme/MyPageProperty";

export const ownerDataStoreScheme: DataStoreScheme<
  CommonPermission,
  { userId: string }
> = {
  name: "admins",
  parse: parseCommonPermission,
  documentId: ({ userId }) => userId
};

const userDataStoreScheme: DataStoreScheme<
  CommonPermission,
  { userId: string }
> = {
  name: "users",
  parse: parseCommonPermission,
  documentId: ({ userId }) => userId
};

export const moneyPlanDataStoreScheme: DataStoreScheme<
  MoneyPlan,
  { planId: string },
  { userId: string }
> = {
  name: "moneyPlans",
  parse: parseMoneyPlan,
  documentId: ({ planId }) => planId,
  parentCollection: userDataStoreScheme
};

export const moneyBankDataStoreScheme: DataStoreScheme<
  MoneyBankAccount,
  { bankId: string },
  { userId: string }
> = {
  name: "moneyBankAccounts",
  parse: parseMoneyBankAccount,
  documentId: ({ bankId }) => bankId,
  parentCollection: userDataStoreScheme
};

export const moneyCardDataStoreScheme: DataStoreScheme<
  MoneyCardAccount,
  { cardId: string },
  { userId: string }
> = {
  name: "moneyCardAccounts",
  parse: parseMoneyCardAccount,
  documentId: ({ cardId }) => cardId,
  parentCollection: userDataStoreScheme
};

export const bankSnapshotDataStoreScheme: DataStoreScheme<
  BankSnapshot,
  { snapshotId: string },
  { userId: string }
> = {
  name: "bankSnapshots",
  parse: parseBankSnapshot,
  documentId: ({ snapshotId }) => snapshotId,
  parentCollection: userDataStoreScheme
};

export const cardSnapshotDataStoreScheme: DataStoreScheme<
  CardSnapshot,
  { snapshotId: string },
  { userId: string }
> = {
  name: "cardSnapshots",
  parse: parseCardSnapshot,
  documentId: ({ snapshotId }) => snapshotId,
  parentCollection: userDataStoreScheme
};

export const myPagePropertyDataStoreScheme: DataStoreScheme<
  MyPageProperty,
  { userId: string }
> = {
  name: "myPageProperties",
  parse: parseMyPageProperty,
  documentId: ({ userId }) => userId
};
