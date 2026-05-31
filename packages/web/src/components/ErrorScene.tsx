import { type ReactNode, useMemo } from "react";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";
import MockStaticLayout from "~/components/MockStaticLayout";

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
