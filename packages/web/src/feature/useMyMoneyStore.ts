import { useEffect, useState } from "react";
import { create } from "zustand";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { type TypedCollectionList } from "@m-visioning/core/util/DataStoreAgent";
import type MoneyBankAccount from "@m-visioning/core/schema/MoneyBankAccount";
import type MoneyCardAccount from "@m-visioning/core/schema/MoneyCardAccount";
import type MoneyPlan from "@m-visioning/core/schema/MoneyPlan";
import type MyPageProperty from "@m-visioning/core/schema/MyPageProperty";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import {
  useCardAccountList,
  useMyCardAccountTools
} from "~/feature/card-account-database";
import {
  useBankAccountList,
  useMyBankAccountTools
} from "~/feature/bank-account-database";
import {
  useMoneyPlanList,
  useMyMoneyPlanTools
} from "~/feature/money-plan-database";
import { useMyPagePropertyItem } from "~/feature/my-page-property-database";

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
