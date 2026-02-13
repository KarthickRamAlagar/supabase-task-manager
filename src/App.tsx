import { useEffect, useState } from "react";
import { Auth } from "./components/auth";
import Crud from "./components/crud";
import supabase from "./utils/supabase";

function App() {
  const [session, setSession] = useState<any>(null);

  const fetchSeession = async () => {
    const currentSession = await supabase.auth.getSession();
    setSession(currentSession.data.session);
    console.log("Current Session :", currentSession);
  };

  useEffect(() => {
    fetchSeession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        console.log("Auth Event:", event, "Session:", session);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };
  return (
    <>
      {session ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 2rem",
              backgroundColor: "#f3f4f6",
            }}
          >
            <button
              onClick={logOut}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          </div>
          <Crud session={session} />
        </>
      ) : (
        <>
          <Auth />
        </>
      )}
    </>
  );
}

export default App;
