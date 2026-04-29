import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createAuction } from "@features/auction/api";
import { Status, AuctionEventType } from "@features/auction/dto";
import type {
  AuctionDetailDTO,
  AuctionEventEnvelopeDTO,
  BidPlacedPayloadDTO,
  InitPayloadDTO,
  StatusPayloadDTO,
  TickPayloadDTO,
} from "@features/auction/dto";
import {
  AuthPayloadSchema,
  PlaceBidPayloadSchema,
} from "@features/auction/dto";
import type { AppError } from "@utils/error";
import {
  FrontendErrorCode,
  handleWSError,
  WSError,
  isBackendErrorCode,
} from "@utils/error";
import { toCamelCase } from "@utils/dto";
import { getAuctionEndpoint } from "@utils/env";
import { getAccessToken } from "@features/auth/token";

export function useAuction(): {
  auction: AuctionDetailDTO | null;
  timer: number;
  memberId: number | null;
  connect: (guildId: string, presetId: number, auctionId: string) => void;
  placeBid: (amount: number) => void;
  isConnected: boolean;
  wasConnected: boolean;
  error: WSError | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [auction, setAuction] = useState<AuctionDetailDTO | null>(null);
  const [timer, setTimer] = useState(0);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [error, setError] = useState<WSError | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleError = (code: number) => {
    try {
      handleWSError(code);
    } catch (error) {
      setError(error as WSError);
    }
  };

  const handleAuctionMessage = (message: AuctionEventEnvelopeDTO) => {
    const rawPayload = message.payload;
    const dto = toCamelCase(rawPayload);

    switch (message.type) {
      case AuctionEventType.INIT: {
        setError(null);
        const initPayload = dto as InitPayloadDTO;
        setAuction(initPayload.auction);
        setMemberId(initPayload.memberId);
        break;
      }

      case AuctionEventType.NEXT_PLAYER: {
        // Mirrors backend on_next_player: dequeue from auction_queue, or swap unsold_queue → auction_queue
        setAuction((prev) => {
          if (!prev) return prev;
          let playerId: number;
          let auctionQueue: number[];
          let unsoldQueue: number[];
          if (prev.auctionQueue.length > 0) {
            const [first, ...rest] = prev.auctionQueue;
            if (first === undefined) return prev;
            playerId = first;
            auctionQueue = rest;
            unsoldQueue = prev.unsoldQueue;
          } else {
            const [first, ...rest] = prev.unsoldQueue;
            if (first === undefined) return prev;
            playerId = first;
            auctionQueue = rest;
            unsoldQueue = [];
          }
          return { ...prev, playerId, auctionQueue, unsoldQueue, bid: null };
        });
        setTimer(0);
        break;
      }

      case AuctionEventType.MEMBER_SOLD: {
        // Mirrors backend on_member_sold: update team membership and points
        setAuction((prev) => {
          if (!prev || prev.playerId === null || prev.bid === null) return prev;
          const { playerId, bid } = prev;
          const teams = prev.teams.map((team) =>
            team.leaderId === bid.leaderId
              ? {
                  ...team,
                  memberIds: [...team.memberIds, playerId],
                  points: team.points - bid.amount,
                }
              : team,
          );
          return { ...prev, teams, playerId: null, bid: null };
        });
        break;
      }

      case AuctionEventType.MEMBER_UNSOLD: {
        // Mirrors backend on_member_unsold: push player to unsold_queue
        setAuction((prev) => {
          if (!prev || prev.playerId === null) return prev;
          return {
            ...prev,
            unsoldQueue: [...prev.unsoldQueue, prev.playerId],
            playerId: null,
            bid: null,
          };
        });
        break;
      }

      case AuctionEventType.TICK: {
        const tickPayload = dto as TickPayloadDTO;
        setTimer(tickPayload.timer);
        break;
      }

      case AuctionEventType.BID_PLACED: {
        setError(null);
        const bidPayload = dto as BidPlacedPayloadDTO;
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            bid: { amount: bidPayload.amount, leaderId: bidPayload.leaderId },
          };
        });
        break;
      }

      case AuctionEventType.STATUS: {
        const statusPayload = dto as StatusPayloadDTO;
        setAuction((prev) => {
          if (!prev) return null;
          const next = { ...prev, status: statusPayload.status };
          if (statusPayload.status === Status.COMPLETED) {
            next.playerId = null;
            next.bid = null;
          }
          return next;
        });
        if (statusPayload.status === Status.COMPLETED) {
          setTimer(0);
          wsRef.current?.close();
        }
        break;
      }

      case AuctionEventType.LEADER_CONNECTED:
        setAuction((prev) =>
          prev
            ? { ...prev, connectedLeaderCount: prev.connectedLeaderCount + 1 }
            : prev,
        );
        break;

      case AuctionEventType.LEADER_DISCONNECTED:
        setAuction((prev) =>
          prev
            ? { ...prev, connectedLeaderCount: prev.connectedLeaderCount - 1 }
            : prev,
        );
        break;

      case AuctionEventType.ERROR: {
        handleError(dto.code);
        break;
      }

      default:
        break;
    }
  };

  const connect = (guildId: string, presetId: number, auctionId: string) => {
    wsRef.current?.close();
    setIsConnected(false);
    setWasConnected(false);
    setAuction(null);
    setTimer(0);
    setMemberId(null);
    setError(null);

    const ws = new WebSocket(
      `${getAuctionEndpoint(guildId, presetId, true)}/${auctionId}`,
    );
    let opened = false;

    ws.onopen = () => {
      const authPayloadResult = AuthPayloadSchema.safeParse({
        access_token: getAccessToken(),
      });
      if (!authPayloadResult.success) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: AuctionEventType.AUTH,
          payload: authPayloadResult.data,
        } satisfies AuctionEventEnvelopeDTO<{ access_token: string | null }>),
      );
      opened = true;
      setIsConnected(true);
      setWasConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AuctionEventEnvelopeDTO;
        handleAuctionMessage(message);
      } catch {
        handleError(FrontendErrorCode.Validation.Invalid);
      }
    };

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      setIsConnected(false);
      if (event.code === 4001) {
        handleError(FrontendErrorCode.Connection.Kicked);
        return;
      }
      const reasonCode = Number.parseInt(event.reason, 10);
      if (Number.isInteger(reasonCode) && isBackendErrorCode(reasonCode)) {
        handleError(reasonCode);
        return;
      }
      if (event.code === 1000 && opened) {
        setError(null);
      } else if (opened) {
        handleError(FrontendErrorCode.Unexpected.External);
      }
    };

    wsRef.current = ws;
  };

  const placeBid = (amount: number) => {
    if (!wsRef.current) {
      return;
    }

    const placeBidPayloadResult = PlaceBidPayloadSchema.safeParse({
      amount,
    });
    if (!placeBidPayloadResult.success) {
      return;
    }

    const message: AuctionEventEnvelopeDTO<{ amount: number }> = {
      type: AuctionEventType.PLACE_BID,
      payload: placeBidPayloadResult.data,
    };

    wsRef.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return {
    auction,
    timer,
    memberId,
    connect,
    placeBid,
    isConnected,
    wasConnected,
    error,
  };
}

export function useCreateAuction(): UseMutationResult<
  Awaited<ReturnType<typeof createAuction>>,
  AppError,
  Parameters<typeof createAuction>[0],
  unknown
> {
  return useMutation({
    mutationFn: createAuction,
  });
}
