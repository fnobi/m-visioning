import { type ReactNode, useMemo } from "react";
import MockStaticLayout from "~/common/components/MockStaticLayout";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

const ErrorScene = ({
  error,
  children
}: {
  error: AppErrorParameter;
  children?: ReactNode;
}) => {
  const msg = useMemo(() => {
    switch (error.type) {
      default:
        return JSON.stringify(error);
    }
  }, [error]);
  return (
    <MockStaticLayout title="error">
      {msg}
      {children}
    </MockStaticLayout>
  );
};

export default ErrorScene;
