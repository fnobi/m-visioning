import { useCallback, useEffect, useState } from "react";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { ClientDataStoreAgent } from "~/common/ClientDataStoreAgent";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import { extractClientError } from "~/feature/client-error-utils";
import { moneyBankDataStoreScheme } from "~/feature/app-data-store-scheme";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import AppError from "~/feature/AppError";

const moneyBankDataStore = new ClientDataStoreAgent(moneyBankDataStoreScheme);

type BankAccountQueryParams = { limit?: number };

// eslint-disable-next-line import/prefer-default-export
export const useBankAccountList = ({
  userId,
  onError,
  limit
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
} & BankAccountQueryParams) => {
  const [list, setList] =
    useState<TypedCollectionList<MoneyBankAccount> | null>(null);

  useEffect(() => {
    setList(null);
    if (!userId) {
      return () => {};
    }
    return moneyBankDataStore.subscribeList({
      userId,
      handler: setList,
      queryChain: c => c.orderBy("order", "asc"),
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError]);

  return { bankAccountList: list };
};

export const useMyBankAccountTools = () => {
  const { myId: userId } = useAuthorizedUser();

  const createBankAccount = useCallback(
    (data: MoneyBankAccount) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyBankDataStore.addItem({
        userId,
        data
      });
    },
    [userId]
  );

  const writeBankAccount = useCallback(
    (bankId: string, data: MoneyBankAccount) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyBankDataStore.mergeItem({
        userId,
        bankId,
        data
      });
    },
    [userId]
  );

  const deleteBankAccount = useCallback(
    (bankId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyBankDataStore.deleteItem({
        userId,
        bankId
      });
    },
    [userId]
  );

  return { createBankAccount, writeBankAccount, deleteBankAccount };
};
