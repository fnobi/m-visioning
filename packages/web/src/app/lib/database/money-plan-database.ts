import { useCallback, useEffect, useState } from "react";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { extractClientError } from "~/app/lib/client-error-utils";
import { moneyPlanDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";

const moneyPlanDataStore = new ClientDataStoreAgent(moneyPlanDataStoreScheme);

type MoenPlanQueryParams = { limit?: number };

export const useMoneyPlanList = ({
  userId,
  onError,
  limit
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
} & MoenPlanQueryParams) => {
  const [list, setList] = useState<TypedCollectionList<MoneyPlan> | null>(null);

  useEffect(() => {
    setList(null);
    if (!userId) {
      return () => {};
    }
    return moneyPlanDataStore.subscribeList({
      userId,
      handler: setList,
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError]);

  return {
    moneyPlanList: list
  };
};

export const useMyMoneyPlanTools = () => {
  const { myId: userId } = useAuthorizedUser();

  const writeMoneyPlan = useCallback(
    (planId: string, data: MoneyPlan) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyPlanDataStore.mergeItem({
        userId,
        planId,
        data
      });
    },
    [userId]
  );

  const createMoneyPlan = useCallback(
    (data: MoneyPlan) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyPlanDataStore.addItem({
        userId,
        data
      });
    },
    [userId]
  );

  const deleteMoneyPlan = useCallback(
    (planId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return moneyPlanDataStore.deleteItem({
        userId,
        planId
      });
    },
    [userId]
  );

  return {
    writeMoneyPlan,
    createMoneyPlan,
    deleteMoneyPlan
  };
};
