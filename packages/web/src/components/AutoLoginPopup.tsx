import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import MockLoadingPopup from "~/components/MockLoadingPopup";
import { firebaseAuth } from "~/common/firebase-app";

const AutoLoginPopup = () => {
  useEffect(() => {
    signInAnonymously(firebaseAuth());
  }, []);
  return <MockLoadingPopup />;
};

export default AutoLoginPopup;
