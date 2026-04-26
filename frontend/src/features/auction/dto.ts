import { z } from "zod";
import type { PresetDetailDTO } from "@features/preset/dto";

export enum Status {
  WAITING = 0,
  PENDING = 1,
  RUNNING = 2,
  COMPLETED = 3,
}

export interface AuctionDTO {
  auctionId: string;
  status: Status;
  connectedLeaderCount: number;
}

export interface AuctionDetailDTO extends AuctionDTO {
  playerId: number | null;
  bid: BidDTO | null;
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
  presetSnapshot: PresetDetailDTO | null;
}

export interface InitPayloadDTO {
  auction: AuctionDetailDTO;
  memberId: number | null;
}

export interface CreateAuctionDTO {
  sendInvite: boolean;
}

export enum AuctionEventType {
  AUTH = 0,
  INIT = 1,
  ERROR = 2,
  TICK = 3,
  STATUS = 4,
  PLACE_BID = 5,
  BID_PLACED = 6,
  MEMBER_SOLD = 7,
  MEMBER_UNSOLD = 8,
  LEADER_CONNECTED = 9,
  LEADER_DISCONNECTED = 10,
  NEXT_PLAYER = 11,
}

export interface AuctionEventEnvelopeDTO<TPayload = unknown> {
  type: AuctionEventType;
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

export interface ErrorPayloadDTO {
  code: number;
}

export interface TickPayloadDTO {
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
