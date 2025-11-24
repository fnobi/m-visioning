import { type DataStoreScheme } from "~/common/lib/DataStoreAgent";
import type CommonPermission from "~/common/scheme/CommonPermission";
import { parseCommonPermission } from "~/common/scheme/CommonPermission";
import { parseMyPageProperty } from "~/app/scheme/MyPageProperty";
import type MyPageProperty from "~/app/scheme/MyPageProperty";
import type BankSnapshot from "~/app/scheme/BankSnapshot";
import type CardSnapshot from "~/app/scheme/CardSnapshot";
import { parseCardSnapshot } from "~/app/scheme/CardSnapshot";
import { parseBankSnapshot } from "~/app/scheme/BankSnapshot";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import { parseMoneyBankAccount } from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import { parseMoneyCardAccount } from "~/app/scheme/MoneyCardAccount";
import { parseMoneyPlan } from "~/app/scheme/MoneyPlan";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

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
