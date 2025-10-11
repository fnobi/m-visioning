import { useCallback, useEffect, useState } from "react";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { boardPostDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { extractClientError } from "~/app/lib/client-error-utils";
import type BoardPost from "~/app/scheme/BoardPost";
import AppError from "~/app/scheme/AppError";

const boardPostDataStore = new ClientDataStoreAgent(boardPostDataStoreScheme);

// eslint-disable-next-line import/prefer-default-export
export const useBoardPostList = ({
  boardId,
  limit = 20,
  onError
}: {
  boardId: string | null;
  limit?: number;
  onError: (e: AppErrorParameter) => void;
}) => {
  const [list, setList] = useState<TypedCollectionList<BoardPost> | null>(null);

  useEffect(() => {
    setList(null);
    if (!boardId) {
      return () => {};
    }
    return boardPostDataStore.subscribeList({
      boardId,
      queryChain: c => {
        let cc = c;
        cc = cc.orderBy("createdAt", "desc");
        if (limit) {
          cc = cc.limit(limit);
        }
        return cc;
      },
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
