import { useState } from "react";
import { extractClientError } from "~/app/core/client-error-utils";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const useAsyncHandler = ({
  onError
}: {
  onError: (e: AppErrorParameter) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const runAsyncHandler = async (fn: () => Promise<unknown>) => {
    setIsLoading(true);
    await fn().catch(err => onError(extractClientError(err)));
    setIsLoading(false);
  };

  return { isLoading, runAsyncHandler };
};

export default useAsyncHandler;
