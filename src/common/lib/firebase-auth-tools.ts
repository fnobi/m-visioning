import { useEffect } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { firebaseAuth } from "~/common/lib/firebase-app";

export type MeState = {
  isAuthLoading: boolean;
  myId: string | null;
  myEmail: string | null;
  emailVerificationProgress: boolean;
};

const meStore = atom<MeState>({
  key: `meStore_${Math.random().toString(36)}`,
  default: {
    isAuthLoading: true,
    myId: null,
    myEmail: null,
    emailVerificationProgress: false
  }
});

export const useAuthorizedUser = () => useRecoilValue(meStore);

export const useAuthRoot = () => {
  const [meState, setMeState] = useRecoilState(meStore);

  useEffect(() => {
    const setMe = (payload: Partial<MeState>) =>
      setMeState(s => ({
        ...s,
        ...payload,
        isAuthLoading: false
      }));

    const cleanMe = (payload: { reset?: boolean }) =>
      setMeState(s => ({
        ...s,
        isAuthLoading: payload.reset || false,
        myId: null,
        myEmail: null
      }));
    const handleAuthStateChange = (user: User | null) => {
      if (user) {
        const isEmailUser = user.providerData.find(
          p => p.providerId === "password"
        );
        setMe({
          myId: user.uid,
          myEmail: user.email,
          emailVerificationProgress: isEmailUser && !user.emailVerified
        });
      } else {
        cleanMe({ reset: false });
      }
    };
    getRedirectResult(firebaseAuth());
    return onAuthStateChanged(firebaseAuth(), handleAuthStateChange);
  }, [setMeState]);

  return meState;
};
