import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

// Resolve Convex URL at runtime with robust fallbacks
// 1) Use Vite build-time var when available
// 2) Fallback to Electron-preloaded env (when running as desktop app)
// 3) As a last resort, use an empty string which will surface a clear error in UI
const runtimeConvexUrl =
  (typeof window !== "undefined" && (window as any)?.electronAPI?.env?.CONVEX_URL) ||
  (import.meta as any).env?.VITE_CONVEX_URL ||
  "";

const rootElement = document.getElementById("root")!;

if (!runtimeConvexUrl) {
  createRoot(rootElement).render(
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#67e8f9",
      fontFamily: "JetBrains Mono, monospace",
    }}>
      Missing Convex configuration. Please set VITE_CONVEX_URL.
    </div>
  );
} else {
  const convex = new ConvexReactClient(runtimeConvexUrl);
  createRoot(rootElement).render(
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>,
  );
}
