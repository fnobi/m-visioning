import { useCallback, useEffect, useState } from "react";
import { ClientDataStoreAgent } from "~/common/lib/ClientDataStoreAgent";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import { extractClientError } from "~/app/lib/client-error-utils";
import { myPagePropertyDataStoreScheme } from "~/app/scheme/app-data-store-scheme";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";
import AppError from "~/app/scheme/AppError";
import type MyPageProperty from "~/app/scheme/MyPageProperty";
import { parseMyPageProperty } from "~/app/scheme/MyPageProperty";

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
