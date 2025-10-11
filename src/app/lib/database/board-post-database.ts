import { useCallback, useEffect, useState } from "react";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import {
  type QueryChain,
  type TypedCollectionList
} from "~/common/lib/DataStoreAgent";
import type TimestampMock from "~/common/scheme/TimestampMock";
import { boardPostDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { extractClientError } from "~/app/lib/client-error-utils";
import type BoardPost from "~/app/scheme/BoardPost";
import AppError from "~/app/scheme/AppError";

const boardPostDataStore = new ClientDataStoreAgent(boardPostDataStoreScheme);

type BoardPostQueryParams = { limit?: number; userId?: string | null };

const makeBoardPostQueryChain =
  ({ userId, limit }: BoardPostQueryParams) =>
  (c: QueryChain<BoardPost>) => {
    let cc = c;
    cc = cc.orderBy("createdAt", "desc");
    if (userId) {
      cc = cc.equal("userId", userId);
    }
    if (limit) {
      cc = cc.limit(limit);
    }
    return cc;
  };

export const createBoardPostItem = async ({
  boardId,
  data: v
}: Parameters<typeof boardPostDataStore.addItem>[0]) => {
  if (!boardId) {
    throw new AppError({ type: "bad-parameter" });
  }
  const data = { ...v, createdAt: serverTimestamp() as Timestamp };
  const id = await boardPostDataStore.addItem({
    boardId,
    data
  });
  return { id, data };
};

export const deleteBoardPostItem = ({
  boardId,
  postId
}: Parameters<typeof boardPostDataStore.deleteItem>[0]) => {
  if (!boardId || !postId) {
    throw new AppError({ type: "bad-parameter" });
  }
  return boardPostDataStore.deleteItem({ boardId, postId });
};

// eslint-disable-next-line import/prefer-default-export
export const useBoardPostList = ({
  boardId,
  onError,
  limit = 20
}: {
  boardId: string | null;
  onError: (e: AppErrorParameter) => void;
} & BoardPostQueryParams) => {
  const [list, setList] = useState<TypedCollectionList<BoardPost> | null>(null);

  useEffect(() => {
    setList(null);
    if (!boardId) {
      return () => {};
    }
    return boardPostDataStore.subscribeList({
      boardId,
      queryChain: makeBoardPostQueryChain({ limit }),
      handler: setList,
      onError: e => onError(extractClientError(e))
    });
  }, [boardId, limit, onError]);

  return { boardPostList: list };
};

export const useBoardPostMoreLoader = ({
  boardId,
  size = 10
}: {
  boardId: string;
  size?: number;
}) => {
  const [list, setList] = useState<TypedCollectionList<BoardPost> | null>(null);
  const [nextSortKey, setNextSortKey] = useState<TimestampMock | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(() => {
    setIsLoading(true);
    boardPostDataStore
      .fetchList({
        boardId,
        queryChain: c => {
          let cc = c;
          cc = cc.limit(size + 1);
          cc = cc.orderBy("createdAt", "desc");
          if (nextSortKey) {
            cc = cc.where("createdAt", "<=", nextSortKey);
          }
          return cc;
        }
      })
      .then(arr => {
        const val = arr.slice(0, size);
        const nex = arr[size];
        setList(l => (l ? [...l, ...val] : val));
        setNextSortKey(nex ? nex.data.createdAt : null);
        setIsLoading(false);
      });
  }, [boardId, nextSortKey, size]);

  useEffect(() => {
    if (!list) {
      loadMore();
    }
  }, [list, loadMore]);

  const resetList = useCallback(() => {
    setList(null);
    setNextSortKey(null);
  }, []);

  const createItem = useCallback(
    (d: BoardPost) =>
      createBoardPostItem({ boardId, data: d }).then(() => resetList()),
    [boardId, resetList]
  );

  const deleteItem = useCallback(
    (postId: string) =>
      deleteBoardPostItem({ boardId, postId }).then(() =>
        setList(l => (l ? l.filter(i => i.id !== postId) : null))
      ),
    [boardId]
  );

  return {
    boardPostList: list,
    isLoading,
    loadMore,
    hasNext: !!nextSortKey,
    createItem,
    deleteItem
  };
};
