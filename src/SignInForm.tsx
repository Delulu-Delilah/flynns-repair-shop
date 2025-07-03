"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", "signIn");
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "ACCESS DENIED: Invalid credentials";
            } else {
              toastTitle = "LOGIN FAILED: Check credentials";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-cyan-400 font-mono text-xs tracking-wider mb-2">
              EMAIL.ADDRESS
            </label>
            <input
              className="auth-input-field"
              type="email"
              name="email"
              placeholder="user@domain.sys"
              required
            />
          </div>
          <div>
            <label className="block text-cyan-400 font-mono text-xs tracking-wider mb-2">
              ACCESS.CODE
            </label>
            <input
              className="auth-input-field"
              type="password"
              name="password"
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>
        
        <button 
          className="auth-button mt-6" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? "AUTHENTICATING..." : "ACCESS SYSTEM"}
        </button>
      </form>
    </div>
  );
}
