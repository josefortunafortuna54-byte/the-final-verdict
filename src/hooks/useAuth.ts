import { useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

let initialized = false;

export const useAuth = () => {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          if (err.code === "auth/operation-not-allowed") {
            console.warn("Anonymous auth not enabled in Firebase Console → go to Authentication > Sign-in method and enable Anonymous.");
          } else {
            console.error("Auth error:", err);
          }
        });
      }
    });

    return () => unsub();
  }, []);
};
