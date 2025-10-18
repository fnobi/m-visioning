import { useCallback, useEffect, useState } from "react";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import {
  type QueryChain,
  type TypedCollectionList
} from "~/common/lib/DataStoreAgent";
import { extractClientError } from "~/app/lib/client-error-utils";
import { bankSnapshotDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";
import type BankSnapshot from "~/app/scheme/BankSnapshot";

const bankSnapshotDataStore = new ClientDataStoreAgent(
  bankSnapshotDataStoreScheme
);

type BankSnapshotQueryParams = {
  bankId?: string;
  limit?: number;
  minTimestamp?: number;
  maxTimestamp?: number;
};

const make = (p: BankSnapshotQueryParams) => (c: QueryChain<BankSnapshot>) => {
  let cc = c.orderBy("timestamp", "desc");
  if (p.limit) {
    cc = cc.limit(p.limit);
  }
  if (p.minTimestamp) {
    cc = cc.where("timestamp", ">=", p.minTimestamp);
  }
  if (p.maxTimestamp) {
    cc = cc.where("timestamp", "<", p.maxTimestamp);
  }
  return cc;
};

// eslint-disable-next-line import/prefer-default-export
export const useBankSnapshotList = ({
  userId,
  onError,
  bankId,
  limit,
  minTimestamp,
  maxTimestamp
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
      queryChain: make({
        limit,
        bankId,
        minTimestamp,
        maxTimestamp
      }),
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, bankId, minTimestamp, maxTimestamp, onError]);

  const writeBankSnapshot = useCallback(
    (snapshotId: string, data: BankSnapshot) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return bankSnapshotDataStore.mergeItem({
        userId,
        snapshotId,
        data
      });
    },
    [userId]
  );

  const deleteBankSnapshot = useCallback(
    (snapshotId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return bankSnapshotDataStore.deleteItem({
        userId,
        snapshotId
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
