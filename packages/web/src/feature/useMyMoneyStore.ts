import { useEffect, useState } from "react";
import { create } from "zustand";
import type MoneyBankAccount from "@m-visioning/core/scheme/MoneyBankAccount";
import type MoneyCardAccount from "@m-visioning/core/scheme/MoneyCardAccount";
import type MoneyPlan from "@m-visioning/core/scheme/MoneyPlan";
import { TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { useMyPagePropertyItem } from "~/feature/my-page-property-database";
import {
  useMoneyPlanList,
  useMyMoneyPlanTools
} from "~/feature/money-plan-database";
import {
  useBankAccountList,
  useMyBankAccountTools
} from "~/feature/bank-account-database";
import {
  useCardAccountList,
  useMyCardAccountTools
} from "~/feature/card-account-database";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import MyPageProperty from "@m-visioning/core/scheme/MyPageProperty";

type CommonMoneyStore = {
  bankAccountList: TypedCollectionList<MoneyBankAccount> | null;
  cardAccountList: TypedCollectionList<MoneyCardAccount> | null;
  moneyPlanList: TypedCollectionList<MoneyPlan> | null;
  myPageProperty: MyPageProperty | null;
};

const useCommonMoneyStore = create<CommonMoneyStore>(() => ({
  bankAccountList: null,
  cardAccountList: null,
  moneyPlanList: null,
  myPageProperty: null
}));

export const useMyMoneyRoot = () => {
  const { myId } = useAuthorizedUser();
  const [statusError, setStatusError] = useState<AppErrorParameter | null>(
    null
  );

  const { moneyPlanList } = useMoneyPlanList({
    userId: myId,
    onError: setStatusError
  });
  const { bankAccountList } = useBankAccountList({
    userId: myId,
    onError: setStatusError
  });
  const { cardAccountList } = useCardAccountList({
    userId: myId,
    onError: setStatusError
  });
  const { myPageProperty } = useMyPagePropertyItem({
    userId: myId,
    onError: setStatusError
  });

  const setCommonDataStore = useCommonMoneyStore.setState;
  useEffect(
    () => setCommonDataStore({ moneyPlanList }),
    [moneyPlanList, setCommonDataStore]
  );
  useEffect(
    () => setCommonDataStore({ bankAccountList }),
    [bankAccountList, setCommonDataStore]
  );
  useEffect(
    () => setCommonDataStore({ cardAccountList }),
    [cardAccountList, setCommonDataStore]
  );
  useEffect(
    () => setCommonDataStore({ myPageProperty }),
    [myPageProperty, setCommonDataStore]
  );

  return { statusError };
};

const useMyMoneyStore = () => {
  const data = useCommonMoneyStore();
  const myBankAccountTools = useMyBankAccountTools();
  const myCardAccountTools = useMyCardAccountTools();
  const myMoneyPlanTools = useMyMoneyPlanTools();
  return {
    ...data,
    ...myBankAccountTools,
    ...myCardAccountTools,
    ...myMoneyPlanTools
  };
};

export default useMyMoneyStore;
