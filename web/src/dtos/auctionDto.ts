export enum AuctionStatus {
  WAITING = 0,
  RUNNING = 1,
  COMPLETED = 2,
}

export interface AuctionDTO {
  auctionId: string;
  guildId: number;
  presetId: number;
  status: AuctionStatus;
  currentMemberId: number | null;
  currentBid: BidDTO | null;
  timer: number;
}

export interface AuctionDetailDTO extends AuctionDTO {
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
  connectedMemberIds: number[];
  presetSnapshot: any | null;
}

export interface InitDTO extends AuctionDetailDTO {
  teamId: number | null;
  memberId: number | null;
}

export interface CreateAuctionDTO {
  isPublic: boolean;
  sendInvite: boolean;
}

export enum MessageType {
  AUTH = 0,
  INIT = 1,
  ERROR = 2,
  TIMER = 3,
  STATUS = 4,
  PLACE_BID = 5,
  BID_PLACED = 6,
  MEMBER_SOLD = 7,
  MEMBER_UNSOLD = 8,
  MEMBER_CONNECTED = 9,
  MEMBER_DISCONNECTED = 10,
  NEXT_MEMBER = 11,
}

export interface AuctionMessageDTO<TData = unknown> {
  type: MessageType;
  data: TData;
}

export interface TeamDTO {
  teamId: number;
  leaderId: number;
  memberIds: number[];
  points: number;
}

export interface BidDTO {
  amount: number;
  leaderId: number;
}

export interface StatusMessageDTO {
  status: AuctionStatus;
}

export interface BidPlacedMessageDTO {
  leaderId: number;
  amount: number;
}

export interface NextMemberMessageDTO {
  memberId: number;
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface MemberSoldMessageDTO {
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface MemberConnectedMessageDTO {
  memberId: number;
}

export interface MemberDisconnectedMessageDTO {
  memberId: number;
}

export interface ErrorMessageDTO {
  code: number;
}

export interface TimerMessageDTO {
  timer: number;
}
