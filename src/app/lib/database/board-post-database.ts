import { useCallback, useEffect, useState } from "react";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { type TypedCollectionList } from "~/common/lib/DataStoreAgent";
import { boardPostDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import { extractClientError } from "~/app/lib/client-error-utils";
import type BoardPost from "~/app/scheme/BoardPost";

const boardPostDataStore = new ClientDataStoreAgent(boardPostDataStoreScheme);

// eslint-disable-next-line import/prefer-default-export
export const useBoardPostList = ({
  limit = 20,
  onError
}: {
  limit?: number;
  onError: (e: AppErrorParameter) => void;
}) => {
  const [list, setList] = useState<TypedCollectionList<BoardPost> | null>(null);

  useEffect(() => {
    setList(null);
    return boardPostDataStore.subscribeList({
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
  }, [limit, onError]);

  const createPostItem = useCallback(
    (v: BoardPost) =>
      boardPostDataStore.addItem({
        data: { ...v, createdAt: serverTimestamp() as Timestamp }
      }),
    []
  );

  const deletePostItem = useCallback(
    (id: string) =>
      boardPostDataStore.deleteItem({
        postId: id
      }),
    []
  );

  return { boardPostList: list, createPostItem, deletePostItem };
};
