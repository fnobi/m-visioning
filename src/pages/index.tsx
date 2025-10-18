import MockLoadingScene from "~/common/components/MockLoadingScene";
import { useAuthorizedUser } from "~/common/lib/firebase-auth-tools";
import LoginScene from "~/app/components/LoginScene";
import MVisionTopScene from "~/app/components/MVisionTopScene";

const PageIndex = () => {
  const { myId, isAuthLoading } = useAuthorizedUser();

  if (isAuthLoading) {
    return <MockLoadingScene />;
  }

  if (!myId) {
    return <LoginScene />;
  }

  return <MVisionTopScene />;
};

export default PageIndex;
