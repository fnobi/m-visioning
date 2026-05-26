import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import MockLoadingPopup from "~/common/components/MockLoadingPopup";
import { firebaseAuth } from "~/common/lib/firebase-app";

const AutoLoginPopup = () => {
  useEffect(() => {
    signInAnonymously(firebaseAuth());
  }, []);
  return <MockLoadingPopup />;
};

export default AutoLoginPopup;
