import { useEffect, useState } from "react";
import { create } from "zustand";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { useMyPagePropertyItem } from "~/app/core/database/my-page-property-database";
import {
  useMoneyPlanList,
  useMyMoneyPlanTools
} from "~/app/core/database/money-plan-database";
import {
  useBankAccountList,
  useMyBankAccountTools
} from "~/app/core/database/bank-account-database";
import {
  useCardAccountList,
  useMyCardAccountTools
} from "~/app/core/database/card-account-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type MyPageProperty from "~/app/scheme/MyPageProperty";

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
