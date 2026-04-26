import { useCallback, useEffect, useState } from "react";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import {
  type QueryChain,
  type TypedCollectionList
} from "~/common/lib/DataStoreAgent";
import { extractClientError } from "~/app/core/client-error-utils";
import { cardSnapshotDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

const cardSnapshotDataStore = new ClientDataStoreAgent(
  cardSnapshotDataStoreScheme
);

type CardSnapshotQueryParams = {
  cardId?: string | null;
  limit?: number;
  minTimestamp?: number;
  maxTimestamp?: number;
};

const makeCardSnapshotQueryChain =
  (p: CardSnapshotQueryParams) => (c: QueryChain<CardSnapshot>) => {
    let cc = c.orderBy("timestamp", "desc");
    if (p.limit) {
      cc = cc.limit(p.limit);
    }
    if (p.cardId) {
      cc = cc.equal("cardId", p.cardId);
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
export const useCardSnapshotList = ({
  userId,
  cardId,
  onError,
  limit,
  minTimestamp,
  maxTimestamp
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
} & CardSnapshotQueryParams) => {
  const [list, setList] = useState<TypedCollectionList<CardSnapshot> | null>(
    null
  );

  useEffect(() => {
    setList(null);
    if (!userId) {
      return () => {};
    }
    return cardSnapshotDataStore.subscribeList({
      userId,
      handler: setList,
      queryChain: makeCardSnapshotQueryChain({
        limit,
        cardId,
        minTimestamp,
        maxTimestamp
      }),
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError, cardId, minTimestamp, maxTimestamp]);

  const writeCardSnapshot = useCallback(
    (snapshotId: string, data: CardSnapshot) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return cardSnapshotDataStore.mergeItem({
        userId,
        snapshotId,
        data
      });
    },
    [userId]
  );

  const deleteCardSnapshot = useCallback(
    (snapshotId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return cardSnapshotDataStore.deleteItem({
        userId,
        snapshotId
      });
    },
    [userId]
  );

  const createCardSnapshot = useCallback(
    (v: CardSnapshot) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return cardSnapshotDataStore.addItem({
        userId,
        data: v
      });
    },
    [userId]
  );

  return {
    cardSnapshotList: list,
    writeCardSnapshot,
    deleteCardSnapshot,
    createCardSnapshot
  };
};
