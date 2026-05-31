import { parseFirebaseErrorType } from "~/common/FirebaseErrorType";
import { parseAppError } from "~/feature/AppError";
import { type AppErrorParameter } from "~/feature/AppErrorParameter";

// eslint-disable-next-line import/prefer-default-export
export const extractClientError = (err: unknown): AppErrorParameter =>
  parseFirebaseErrorType(err) || parseAppError(err) || { type: "unknown" };
