import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { firebaseAuth } from "~/common/firebase-app";
import MockLoadingPopup from "~/components/MockLoadingPopup";

const AutoLoginPopup = () => {
  useEffect(() => {
    signInAnonymously(firebaseAuth());
  }, []);
  return <MockLoadingPopup />;
};

export default AutoLoginPopup;
