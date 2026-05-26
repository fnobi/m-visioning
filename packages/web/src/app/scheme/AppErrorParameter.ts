import { type FirebaseErrorType } from "~/common/scheme/FirebaseErrorType";

export type AppErrorParameter =
  | {
      type: "unknown";
    }
  | {
      type: "unauthorized";
    }
  | {
      type: "bad-parameter";
    }
  | {
      type: "fail-to-google-auth";
    }
  | {
      type: "fail-to-write-profile";
    }
  | {
      type: "fail-to-create-trade";
    }
  | FirebaseErrorType;
