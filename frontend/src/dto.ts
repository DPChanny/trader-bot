export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

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

export type Statistics = "NONE" | "LOL" | "VAL";
export const StatisticsDisplay: { [key in Statistics]: string } = {
  NONE: "",
  LOL: "LoL",
  VAL: "Valorant",
};

export interface Preset {
  presetId: number;
  name: string;
  points: number;
  time: number;
  pointScale: number;
  statistics: Statistics;
}

export interface PresetDetail extends Preset {
  presetUsers: PresetUserDetail[];
  tiers: Tier[];
  positions: Position[];
}

export interface PresetUser {
  presetUserId: number;
  presetId: number;
  userId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetUserDetail extends PresetUser {
  user: User;
  tier: Tier | null;
  positions: PresetUserPosition[];
}

export interface User {
  userId: number;
  alias: string | null;
  riotId: string | null;
  discordId: string | null;
  profileUrl: string | null;
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

export interface PresetUserPosition {
  presetUserPositionId: number;
  presetUserId: number;
  positionId: number;
  position: Position;
}

export interface Team {
  teamId: number;
  leaderId: number;
  memberIdList: number[];
  points: number;
}

export interface ChampionDto {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface LolStatDto {
  tier: string;
  rank: string;
  lp: number;
  topChampions: ChampionDto[];
}

export interface AgentDto {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface ValStatDto {
  tier: string;
  rank: string;
  topAgents: AgentDto[];
}
