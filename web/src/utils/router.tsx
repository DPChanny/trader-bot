import { useEffect } from "preact/hooks";
import Router, { route } from "preact-router";
import type { RoutableProps } from "preact-router";
import { MemberPage } from "@/pages/memberPage/memberPage";
import { PresetPage } from "@/pages/presetPage/presetPage";
import { HomePage } from "@/pages/homePage/homePage";
import { AuctionPage } from "@/pages/auctionPage/auctionPage";
import { useLoginCallback } from "@/hooks/auth";
import { isAuthenticated } from "@/utils/auth";

function RootRoute({}: RoutableProps) {
  return <HomePage />;
}

function LoginCallbackRoute({}: RoutableProps) {
  useLoginCallback();

  return null;
}

function MemberRoute({ guildId }: RoutableProps & { guildId?: string }) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);

  if (!guildId) {
    route("/", true);
    return null;
  }

  return <MemberPage guildId={guildId} />;
}

function PresetRoute({
  guildId,
  presetId,
}: RoutableProps & { guildId?: string; presetId?: string }) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);

  if (!guildId || !presetId) {
    route("/", true);
    return null;
  }

  return <PresetPage guildId={guildId} presetId={parseInt(presetId, 10)} />;
}

function AuctionRoute({ auctionId }: RoutableProps & { auctionId?: string }) {
  return <AuctionPage auctionId={auctionId} />;
}

export function AppRouter() {
  return (
    <Router>
      <LoginCallbackRoute path="/auth/callback" />
      <RootRoute path="/" />
      <PresetRoute path="/guild/:guildId/preset/:presetId" />
      <MemberRoute path="/guild/:guildId/member" />
      <AuctionRoute path="/auction/:auctionId" />
    </Router>
  );
}
