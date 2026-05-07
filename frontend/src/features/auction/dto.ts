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
}

export interface AuctionDetailDTO extends AuctionDTO {
  status: Status;
  connectedLeaderCount: number;
  playerId: number | null;
  bid: BidDTO | null;
  teams: TeamDTO[];
  auctionQueue: number[];
  unsoldQueue: number[];
  presetSnapshot: PresetDetailDTO | null;
  ttl: number;
  timer: number;
}

export interface InitPayloadDTO {
  auction: AuctionDetailDTO;
  memberId: number | null;
}

export enum AuctionClientEventType {
  AUTH = 0,
  PLACE_BID = 1,
}

export enum AuctionServerEventType {
  INIT = 0,
  ERROR = 1,
  TICK = 2,
  STATUS = 3,
  BID_PLACED = 4,
  MEMBER_SOLD = 5,
  MEMBER_UNSOLD = 6,
  LEADER_CONNECTED = 7,
  LEADER_DISCONNECTED = 8,
  NEXT_PLAYER = 9,
  EXPIRED = 10,
}

export interface AuctionClientEventEnvelopeDTO<TPayload = unknown> {
  type: AuctionClientEventType;
  payload: TPayload;
}

export interface AuctionServerEventEnvelopeDTO<TPayload = unknown> {
  type: AuctionServerEventType;
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
