import { useCallback, useEffect, useState } from "react";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { extractClientError } from "~/app/lib/client-error-utils";
import { cardSnapshotDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";
import type CardSnapshot from "~/app/scheme/CardSnapshot";

const cardSnapshotDataStore = new ClientDataStoreAgent(
  cardSnapshotDataStoreScheme
);

type CardSnapshotQueryParams = { cardId?: string; limit?: number };

// eslint-disable-next-line import/prefer-default-export
export const useCardSnapshotList = ({
  userId,
  cardId,
  onError,
  limit
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
      queryChain: c => {
        let cc = c.orderBy("timestamp", "desc");
        if (cardId) {
          cc = cc.equal("cardId", cardId);
        }
        return cc;
      },
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError, cardId]);

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
