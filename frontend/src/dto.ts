export interface Auction {
  auctionId: string;
  presetId: number;
}

export type MessageType =
  | "timer"
  | "place_bid"
  | "bid_placed"
  | "user_sold"
  | "user_unsold"
  | "next_user"
  | "queue_update"
  | "init"
  | "status"
  | "error"
  | "user_connected"
  | "user_disconnected";

export interface WebSocketMessage {
  type: MessageType;
  data: any;
}

export interface AuctionInitData {
  auctionId: string;
  presetId: number;
  status: "waiting" | "in_progress" | "completed";
  currentUserId: number | null;
  currentBid: number | null;
  currentBidder: number | null;
  timer: number;
  teams: Team[];
  auctionQueue: number[];
  unsoldQueue: number[];
  teamId: number | null;
  userId: number;
  isLeader: boolean;
  connectedUsers: number[];
}

export interface BidResponseData {
  teamId: number;
  leaderId: number;
  amount: number;
}

export interface NextUserData {
  userId: number;
}

export interface QueueUpdateData {
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface UserSoldData {
  userId: number;
  teamId: number;
  amount: number;
  teams: Team[];
}

export interface TimerData {
  timer: number;
}

export interface Guild {
  guildId: number;
  discordId: string;
  name: string;
}

export interface User {
  userId: number;
  discordId: string;
  name: string;
}

export interface Member {
  memberId: number;
  guildId: number;
  alias: string | null;
  riotId: string | null;
  discordId: string | null;
  profileUrl: string | null;
}

export type Statistics = "NONE" | "LOL" | "VAL";
export const StatisticsDisplay: { [key in Statistics]: string } = {
  NONE: "",
  LOL: "LoL",
  VAL: "Valorant",
};

export interface Preset {
  presetId: number;
  guildId: number;
  name: string;
  points: number;
  time: number;
  pointScale: number;
  statistics: Statistics;
}

export interface PresetDetail extends Preset {
  presetMembers: PresetMemberDetail[];
  tiers: Tier[];
  positions: Position[];
}

export interface PresetMember {
  presetMemberId: number;
  presetId: number;
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetMemberDetail extends PresetMember {
  member: Member | null;
  tier: Tier | null;
  presetMemberPositions: PresetMemberPosition[];
}

export interface Tier {
  tierId: number;
  presetId: number;
  name: string;
}

export interface Position {
  positionId: number;
  presetId: number;
  name: string;
  iconUrl?: string | null;
}

export interface PresetMemberPosition {
  presetMemberPositionId: number;
  presetMemberId: number;
  positionId: number;
  position: Position;
}

export interface Team {
  teamId: number;
  leaderId: number;
  memberIdList: number[];
  points: number;
}

export interface ChampionDTO {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface LolStatDTO {
  tier: string;
  rank: string;
  lp: number;
  topChampions: ChampionDTO[];
}

export interface AgentDTO {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface ValStatDTO {
  tier: string;
  rank: string;
  topAgents: AgentDTO[];
}
