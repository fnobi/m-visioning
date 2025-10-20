import { useEffect, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { useMoneyPlanList } from "~/app/lib/database/money-plan-database";
import { useBankAccountList } from "~/app/lib/database/bank-account-database";
import { useCardAccountList } from "~/app/lib/database/card-account-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";

const commonMoneyStore = atom<{
  bankAccountList: TypedCollectionList<MoneyBankAccount> | null;
  cardAccountList: TypedCollectionList<MoneyCardAccount> | null;
  moneyPlanList: TypedCollectionList<MoneyPlan> | null;
}>({
  key: "common-money-store",
  default: {
    bankAccountList: null,
    cardAccountList: null,
    moneyPlanList: null
  }
});

export const useCommonMoneyRoot = () => {
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

  const setCommonDataStore = useSetRecoilState(commonMoneyStore);
  useEffect(
    () => setCommonDataStore(o => ({ ...o, moneyPlanList })),
    [moneyPlanList, setCommonDataStore]
  );
  useEffect(
    () => setCommonDataStore(o => ({ ...o, bankAccountList })),
    [bankAccountList, setCommonDataStore]
  );
  useEffect(
    () => setCommonDataStore(o => ({ ...o, cardAccountList })),
    [cardAccountList, setCommonDataStore]
  );

  return { statusError };
};

const useCommonMoneyStore = () => useRecoilValue(commonMoneyStore);

export default useCommonMoneyStore;
