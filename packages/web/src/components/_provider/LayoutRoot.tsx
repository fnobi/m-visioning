import { type ReactNode } from "react";
import { useAuthRoot } from "~/common/firebase-auth-tools";
import ErrorScene from "~/components/ErrorScene";
import { useMyMoneyRoot } from "~/feature/useMyMoneyStore";

const LayoutRoot = ({ children }: { children: ReactNode }) => {
  useAuthRoot();
  const { statusError } = useMyMoneyRoot();

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{children}</div>;
};

export default LayoutRoot;
