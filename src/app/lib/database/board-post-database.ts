import { useCallback, useEffect, useState } from "react";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import {
  type QueryChain,
  type TypedCollectionList
} from "~/common/lib/DataStoreAgent";
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

  const createPostItem = useCallback(
    (v: BoardPost) => {
      if (!boardId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return boardPostDataStore.addItem({
        boardId,
        data: { ...v, createdAt: serverTimestamp() as Timestamp }
      });
    },
    [boardId]
  );

  const deletePostItem = useCallback(
    (id: string) => {
      if (!boardId) {
        throw new AppError({ type: "bad-parameter" });
      }

      return boardPostDataStore.deleteItem({
        boardId,
        postId: id
      });
    },
    [boardId]
  );

  return { boardPostList: list, createPostItem, deletePostItem };
};
