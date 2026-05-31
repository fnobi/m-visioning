import { type ReactNode } from "react";
import { useAuthorizedUser } from "~/common/firebase-auth-tools";
import MockLoadingScene from "~/components/MockLoadingScene";
import LoginScene from "~/components/LoginScene";

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
