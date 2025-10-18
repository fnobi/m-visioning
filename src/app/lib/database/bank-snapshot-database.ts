import { useCallback, useEffect, useState } from "react";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { extractClientError } from "~/app/lib/client-error-utils";
import { bankSnapshotDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const bankSnapshotDataStore = new ClientDataStoreAgent(
  bankSnapshotDataStoreScheme
);

type BankSnapshotQueryParams = { limit?: number };

// eslint-disable-next-line import/prefer-default-export
export const useBankSnapshotList = ({
  userId,
  onError,
  limit
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
} & BankSnapshotQueryParams) => {
  const [list, setList] = useState<TypedCollectionList<BankSnapshot> | null>(
    null
  );

  useEffect(() => {
    setList(null);
    if (!userId) {
      return () => {};
    }
    return bankSnapshotDataStore.subscribeList({
      userId,
      handler: setList,
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError]);

  const writeBankSnapshot = useCallback(
    (bankId: string, data: BankSnapshot) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return bankSnapshotDataStore.mergeItem({
        userId,
        bankId,
        data
      });
    },
    [userId]
  );

  const deleteBankSnapshot = useCallback(
    (bankId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return bankSnapshotDataStore.deleteItem({
        userId,
        bankId
      });
    },
    [userId]
  );

  return {
    bankSnapshotList: list,
    writeBankSnapshot,
    deleteBankSnapshot
  };
};
