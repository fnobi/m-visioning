import { parseFirebaseErrorType } from "~/common/scheme/FirebaseErrorType";
import { parseAppError } from "~/app/scheme/AppError";
import { type AppErrorParameter } from "~/app/scheme/AppErrorParameter";

// eslint-disable-next-line import/prefer-default-export
export const extractClientError = (err: unknown): AppErrorParameter =>
  parseFirebaseErrorType(err) || parseAppError(err) || { type: "unknown" };
