import { useEffect, useState } from "react";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { useMyPagePropertyItem } from "~/app/lib/database/my-page-property-database";
import { useMoneyPlanList } from "~/app/lib/database/money-plan-database";
import { useBankAccountList } from "~/app/lib/database/bank-account-database";
import { useCardAccountList } from "~/app/lib/database/card-account-database";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import type MoneyBankAccount from "~/app/scheme/MoneyBankAccount";
import type MoneyCardAccount from "~/app/scheme/MoneyCardAccount";
import type MoneyPlan from "~/app/scheme/MoneyPlan";
import type MyPageProperty from "~/app/scheme/MyPageProperty";

const commonMoneyStore = atom<{
  bankAccountList: TypedCollectionList<MoneyBankAccount> | null;
  cardAccountList: TypedCollectionList<MoneyCardAccount> | null;
  moneyPlanList: TypedCollectionList<MoneyPlan> | null;
  myPageProperty: MyPageProperty | null;
}>({
  key: "common-money-store",
  default: {
    bankAccountList: null,
    cardAccountList: null,
    moneyPlanList: null,
    myPageProperty: null
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
  const { myPageProperty } = useMyPagePropertyItem({
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
  useEffect(
    () => setCommonDataStore(o => ({ ...o, myPageProperty })),
    [myPageProperty, setCommonDataStore]
  );

  return { statusError };
};

const useCommonMoneyStore = () => useRecoilValue(commonMoneyStore);

export default useCommonMoneyStore;
