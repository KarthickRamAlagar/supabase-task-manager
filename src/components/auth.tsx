import {} from "@supabase/supabase-js";
import { useState } from "react";
import supabase from "../utils/supabase";

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isSignUp) {
      // Logic for signing up a new user
      const { error: SignUpError } = await supabase.auth.signUp(credentials);
      if (SignUpError) {
        console.error("Error signing up:", SignUpError);
        alert("Failed to sign up. Please try again.");
        return;
      }
    } else {
      // Logic for signing in an existing user
      const { error: SignInError } =
        await supabase.auth.signInWithPassword(credentials);
      if (SignInError) {
        console.error("Error signing in:", SignInError);
        alert(
          "Failed to sign in. Please check your credentials and try again.",
        );
        return;
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, email: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: "0.95rem",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1.25rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: "0.95rem",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 500,
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.9rem",
            color: "#6b7280",
          }}
        >
          {isSignUp ? "Already have an account?" : "Don't have an account?"}

          <button
            onClick={() => setIsSignUp((prev) => !prev)}
            style={{
              marginLeft: "6px",
              background: "none",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
