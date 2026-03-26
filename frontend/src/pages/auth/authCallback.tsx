import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { setAuthToken } from "@/utils/auth";

interface AuthCallbackProps {
  path?: string;
}

export function AuthCallback({}: AuthCallbackProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
    }
    route("/", true);
  }, []);

  return <div>인증 처리 중...</div>;
}
