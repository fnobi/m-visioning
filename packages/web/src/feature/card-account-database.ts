import { useCallback, useEffect, useState } from "react";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { ClientDataStoreAgent } from "~/common/ClientDataStoreAgent";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import type MoneyCardAccount from "@m-visioning/core/schema/MoneyCardAccount";
import { extractClientError } from "~/feature/client-error-utils";
import { moneyCardDataStoreScheme } from "~/feature/app-data-store-scheme";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import AppError from "~/feature/AppError";

const moneyCardDataStore = new ClientDataStoreAgent(moneyCardDataStoreScheme);

type CardAccountQueryParams = { limit?: number };

// eslint-disable-next-line import/prefer-default-export
export const useCardAccountList = ({
  userId,
  onError,
  limit
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
} & CardAccountQueryParams) => {
  const [list, setList] =
    useState<TypedCollectionList<MoneyCardAccount> | null>(null);

  useEffect(() => {
    setList(null);
    if (!userId) {
      return () => {};
    }
    return moneyCardDataStore.subscribeList({
      userId,
      handler: setList,
      queryChain: c => c.orderBy("order", "asc"),
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError]);

  return {
    cardAccountList: list
  };
};

export const useMyCardAccountTools = () => {
  const { myId: userId } = useAuthorizedUser();

  const createCardAccount = useCallback(
    (data: MoneyCardAccount) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyCardDataStore.addItem({
        userId,
        data
      });
    },
    [userId]
  );

  const writeCardAccount = useCallback(
    (cardId: string, data: MoneyCardAccount) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyCardDataStore.mergeItem({
        userId,
        cardId,
        data
      });
    },
    [userId]
  );

  const deleteCardAccount = useCallback(
    (cardId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyCardDataStore.deleteItem({
        userId,
        cardId
      });
    },
    [userId]
  );

  return { createCardAccount, writeCardAccount, deleteCardAccount };
};
