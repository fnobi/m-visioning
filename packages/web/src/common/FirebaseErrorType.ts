import { FirebaseError } from "firebase/app";

export type FirebaseErrorType =
  | {
      type: "firestore-permission-error";
    }
  | {
      type: "firestore-precondition-error";
    }
  | {
      type: "firestore-unknown-error";
      code: string;
    };

export const parseFirebaseErrorType = (
  e: unknown
): FirebaseErrorType | null => {
  if (!(e instanceof FirebaseError)) {
    return null;
  }
  const { code } = e;
  if (code === "failed-precondition") {
    // NOTE: エラーログにindex設定用のリンクが来るのでログしてほしい
    // eslint-disable-next-line no-console
    console.error(e);
    return { type: "firestore-precondition-error" };
  }
  if (code === "permission-denied") {
    return { type: "firestore-permission-error" };
  }
  return { type: "firestore-unknown-error", code };
};
