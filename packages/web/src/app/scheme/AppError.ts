import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

class AppError extends Error {
  public readonly parameter: AppErrorParameter;

  public constructor(param: AppErrorParameter) {
    super();
    this.parameter = param;
  }
}

export const parseAppError = (err: unknown) =>
  err instanceof AppError ? err.parameter : null;

export default AppError;
