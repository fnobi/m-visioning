import { type ReactNode } from "react";
import { useAuthRoot } from "~/common/firebase-auth-tools";
import { useMyMoneyRoot } from "~/feature/useMyMoneyStore";
import ErrorScene from "~/components/ErrorScene";

const LayoutRoot = ({ children }: { children: ReactNode }) => {
  useAuthRoot();
  const { statusError } = useMyMoneyRoot();

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{children}</div>;
};

export default LayoutRoot;
