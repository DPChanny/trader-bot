import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { isAuthenticated } from "@/utils/auth";

interface HomeProps {
  path?: string;
}

export function HomePage({}: HomeProps) {
  useEffect(() => {
    if (isAuthenticated()) {
      route("/guild", true);
    } else {
      route("/auth/login", true);
    }
  }, []);

  return null;
}
