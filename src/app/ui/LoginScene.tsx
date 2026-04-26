import { useCallback, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import MockActionButton from "~/common/components/MockActionButton";
import { firebaseAuth } from "~/common/lib/firebase-app";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import useAsyncHandler from "~/app/core/useAsyncHandler";
import ErrorPopup from "~/app/ui/ErrorPopup";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const LoginScene = () => {
  const [operationError, setOperationError] =
    useState<AppErrorParameter | null>(null);
  const { isLoading, runAsyncHandler } = useAsyncHandler({
    onError: setOperationError
  });
  const handleLogin = useCallback(
    () =>
      runAsyncHandler(() =>
        signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
      ),
    [runAsyncHandler]
  );

  return (
    <>
      <MockStaticLayout title="ログインする">
        <MockActionButton action={{ type: "button", onClick: handleLogin }}>
          Googleでログイン
        </MockActionButton>
      </MockStaticLayout>
      {isLoading ? <MockLoadingPopup /> : null}
      {operationError ? (
        <ErrorPopup
          error={operationError}
          onClose={() => setOperationError(null)}
        />
      ) : null}
    </>
  );
};

export default LoginScene;
