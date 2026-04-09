export interface AuctionDTO {
  auctionId: string;
  presetId: number;
}

export type MessageType =
  | "timer"
  | "place_bid"
  | "bid_placed"
  | "member_sold"
  | "member_unsold"
  | "next_member"
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

export interface Team {
  teamId: number;
  leaderId: number;
  memberIdList: number[];
  points: number;
}

export interface AuctionInitDTO {
  auctionId: string;
  presetId: number;
  guildId: string;
  status: "waiting" | "in_progress" | "completed";
  currentMemberId: number | null;
  currentBid: number | null;
  currentBidder: number | null;
  timer: number;
  teams: Team[];
  auctionQueue: number[];
  unsoldQueue: number[];
  teamId: number | null;
  memberId: number;
  isLeader: boolean;
  connectedUsers: number[];
}

export interface BidPlacedMessageData {
  teamId: number;
  leaderId: number;
  amount: number;
}

export interface NextMemberMessageData {
  memberId: number;
}

export interface QueueUpdateMessageData {
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface MemberSoldMessageData {
  teams: Team[];
}

export interface TimerMessageData {
  timer: number;
}
