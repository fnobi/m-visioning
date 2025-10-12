import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

export const MASTER_MONEY_BANKS: TypedCollectionList<MoneyBankAccount> = [];

export const MASTER_MONEY_CARDS: TypedCollectionList<MoneyCardAccount> = [];

export const MASTER_PLANS: TypedCollectionList<MoneyPlan> = [];

export const MASTER_BANK_SNAPSHOT: TypedCollectionList<BankSnapshot> = [];
