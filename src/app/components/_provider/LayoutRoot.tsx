import { type ReactNode } from "react";
import { useAuthRoot } from "~/common/lib/firebase-auth-tools";
import ErrorScene from "~/app/components/ErrorScene";
import { useCommonMoneyRoot } from "~/app/lib/database/useCommonMoneyStore";

const LayoutRoot = ({ children }: { children: ReactNode }) => {
  useAuthRoot();
  const { statusError } = useCommonMoneyRoot();

  if (statusError) {
    return <ErrorScene error={statusError} />;
  }

  return <div>{children}</div>;
};

export default LayoutRoot;
