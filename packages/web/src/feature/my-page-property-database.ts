import { useCallback, useEffect, useState } from "react";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import { ClientDataStoreAgent } from "~/common/ClientDataStoreAgent";
import {
  parseMyPageProperty
} from "@m-visioning/core/scheme/MyPageProperty";
import type MyPageProperty from "@m-visioning/core/scheme/MyPageProperty";
import { extractClientError } from "~/feature/client-error-utils";
import { myPagePropertyDataStoreScheme } from "~/feature/app-data-store-scheme";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import AppError from "~/feature/AppError";

const myPagePropertyDataStore = new ClientDataStoreAgent(
  myPagePropertyDataStoreScheme
);

export const useMyPagePropertyItem = ({
  userId,
  onError
}: {
  userId: string | null;
  onError: (e: AppErrorParameter) => void;
}) => {
  const [item, setItem] = useState<MyPageProperty | null>(null);

  useEffect(() => {
    setItem(null);
    if (!userId) {
      return () => {};
    }
    return myPagePropertyDataStore.subscribeItem({
      userId,
      handler: v => setItem(parseMyPageProperty(v)),
      onError: e => onError(extractClientError(e))
    });
  }, [userId, onError]);

  return { myPageProperty: item };
};

export const useMyPagePropertyTools = () => {
  const { myId: userId } = useAuthorizedUser();

  const writeMyPageProperty = useCallback(
    (v: Partial<MyPageProperty>) => {
      if (!userId) {
        throw new AppError({ type: "bad-parameter" });
      }
      return myPagePropertyDataStore.mergeItem({
        userId,
        data: v
      });
    },
    [userId]
  );

  return { writeMyPageProperty };
};
