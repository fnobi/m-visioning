import { type ReactNode } from "react";
import { useAuthRoot } from "~/common/lib/firebase-auth-tools";
import ErrorScene from "~/app/ui/ErrorScene";
import { useMyMoneyRoot } from "~/app/core/database/useMyMoneyStore";

const LayoutRoot = ({ children }: { children: ReactNode }) => {
  useAuthRoot();
  const { statusError } = useMyMoneyRoot();

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{children}</div>;
};

export default LayoutRoot;
