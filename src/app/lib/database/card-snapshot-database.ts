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

type CardSnapshotQueryParams = { limit?: number };

// eslint-disable-next-line import/prefer-default-export
export const useCardSnapshotList = ({
  userId,
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
      onError: e => onError(extractClientError(e))
    });
  }, [userId, limit, onError]);

  const writeCardSnapshot = useCallback(
    (cardId: string, data: CardSnapshot) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return cardSnapshotDataStore.mergeItem({
        userId,
        cardId,
        data
      });
    },
    [userId]
  );

  const deleteCardSnapshot = useCallback(
    (cardId: string) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return cardSnapshotDataStore.deleteItem({
        userId,
        cardId
      });
    },
    [userId]
  );

  return {
    cardSnapshotList: list,
    writeCardSnapshot,
    deleteCardSnapshot
  };
};
