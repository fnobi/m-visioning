import { type ReactNode, useMemo } from "react";
import MockStaticLayout from "~/components/MockStaticLayout";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";

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
