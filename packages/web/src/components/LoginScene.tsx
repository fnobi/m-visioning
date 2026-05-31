import { useCallback, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth } from "~/common/firebase-app";
import useAsyncHandler from "~/feature/useAsyncHandler";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import MockActionButton from "~/components/MockActionButton";
import MockStaticLayout from "~/components/MockStaticLayout";
import MockLoadingPopup from "~/components/MockLoadingPopup";
import ErrorPopup from "~/components/ErrorPopup";

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
