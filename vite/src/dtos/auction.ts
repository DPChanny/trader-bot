import { z } from "zod";
import type { PresetDetailDTO } from "./preset";

export enum Status {
  WAITING = 0,
  RUNNING = 1,
  COMPLETED = 2,
}

export interface AuctionDTO {
  auctionId: string;
  guildId: string;
  presetId: number;
  status: Status;
  currentMemberId: number | null;
  currentBid: BidDTO | null;
  timer: number;
}

export interface AuctionDetailDTO extends AuctionDTO {
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
  connectedMemberIds: number[];
  presetSnapshot: PresetDetailDTO | null;
}

export interface InitPayloadDTO {
  auction: AuctionDetailDTO;
  teamId: number | null;
  memberId: number | null;
}

export interface CreateAuctionDTO {
  isPublic: boolean;
  sendInvite: boolean;
}

export enum AuctionMessageType {
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

export interface AuctionMessageEnvelopeDTO<TPayload = unknown> {
  type: AuctionMessageType;
  payload: TPayload;
}

export interface TeamDTO {
  teamId: number;
  leaderId: number;
  memberIds: number[];
  points: number;
}

export const TeamSchema = z.object({
  teamId: z.number().int(),
  leaderId: z.number().int(),
  memberIds: z.array(z.number().int()),
  points: z.number().int(),
});

export interface BidDTO {
  amount: number;
  leaderId: number;
}

export interface StatusPayloadDTO {
  status: Status;
}

export interface BidPlacedPayloadDTO {
  leaderId: number;
  amount: number;
}

export interface NextMemberPayloadDTO {
  memberId: number;
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface MemberSoldPayloadDTO {
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
}

export interface MemberUnsoldPayloadDTO {
  memberId: number;
}

export interface MemberConnectedPayloadDTO {
  memberId: number;
}

export interface MemberDisconnectedPayloadDTO {
  memberId: number;
}

export interface ErrorPayloadDTO {
  code: number;
}

export interface TimerPayloadDTO {
  timer: number;
}

export interface AuthPayloadDTO {
  access_token: string | null;
}

export const AuthPayloadSchema = z.object({
  access_token: z.string().nullable(),
});

export const PlaceBidPayloadSchema = z.object({
  amount: z.number().int().min(1).max(10000),
});
