import { type ReactNode } from "react";
import MockLoadingScene from "~/common/components/MockLoadingScene";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import LoginScene from "~/app/components/LoginScene";

const AuthFrame = ({ children }: { children: ReactNode }) => {
  const { myId, isAuthLoading } = useAuthorizedUser();

  if (isAuthLoading) {
    return <MockLoadingScene />;
  }

  if (!myId) {
    return <LoginScene />;
  }

  return children;
};

export default AuthFrame;
