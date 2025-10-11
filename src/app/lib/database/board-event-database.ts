import { useCallback, useEffect, useState } from "react";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import {
  type QueryChain,
  type TypedCollectionList
} from "~/common/lib/DataStoreAgent";
import { boardEventDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { extractClientError } from "~/app/lib/client-error-utils";
import type BoardEvent from "~/app/scheme/BoardEvent";

const boardEventDataStore = new ClientDataStoreAgent(boardEventDataStoreScheme);

const makeBoardEventQueryChain =
  ({ limit }: { limit?: number }) =>
  (c: QueryChain<BoardEvent>) => {
    let cc = c;
    cc = cc.orderBy("createdAt", "desc");
    if (limit) {
      cc = cc.limit(limit);
    }
    return cc;
  };

export const fetchBoardEventList = (
  ...params: Parameters<typeof makeBoardEventQueryChain>
) =>
  boardEventDataStore.fetchList({
    queryChain: makeBoardEventQueryChain(...params)
  });

export const useBoardEventList = ({
  onError,
  ...params
}: {
  onError: (e: AppErrorParameter) => void;
} & Parameters<typeof makeBoardEventQueryChain>[0]) => {
  const [list, setList] = useState<TypedCollectionList<BoardEvent> | null>(
    null
  );

  useEffect(() => {
    setList(null);
    return boardEventDataStore.subscribeList({
      queryChain: makeBoardEventQueryChain(params),
      handler: setList,
      onError: e => onError(extractClientError(e))
    });
  }, [onError, params]);

  const createEventItem = useCallback(
    (v: BoardEvent) =>
      boardEventDataStore.addItem({
        data: { ...v, createdAt: serverTimestamp() as Timestamp }
      }),
    []
  );

  const deleteEventItem = useCallback(
    (id: string) =>
      boardEventDataStore.deleteItem({
        boardId: id
      }),
    []
  );

  return {
    boardEventList: list,
    createEventItem,
    deleteEventItem
  };
};

export const fetchBoardEventItem = (boardId: string) =>
  boardEventDataStore.fetchItem({ boardId });

export const useBoardEventItem = ({
  boardId,
  onError
}: {
  boardId: string | null;
  onError: (e: AppErrorParameter) => void;
}) => {
  const [item, setItem] = useState<BoardEvent | null>(null);

  useEffect(() => {
    if (!boardId) {
      return () => {};
    }
    return boardEventDataStore.subscribeItem({
      boardId,
      handler: setItem,
      onError: e => onError(extractClientError(e))
    });
  }, [boardId, onError]);

  return { boardEventItem: item };
};
