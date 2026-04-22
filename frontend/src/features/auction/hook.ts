import { useMutation, type UseMutationResult } from "@tanstack/preact-query";
import { useEffect, useRef, useState } from "preact/hooks";
import { createAuction } from "@features/auction/api";
import { Status, AuctionMessageType } from "@features/auction/dto";
import type {
  AuctionDetailDTO,
  AuctionMessageEnvelopeDTO,
  InitPayloadDTO,
} from "@features/auction/dto";
import { AuthPayloadSchema, PlaceBidPayloadSchema } from "@features/auction/dto";
import type { AppError } from "@utils/error";
import {
  FrontendErrorCode,
  handleWSError,
  WSError,
  isBackendErrorCode,
} from "@utils/error";
import { toCamelCase } from "@utils/dto";
import { getAuctionEndpoint } from "@utils/env";
import { getAccessToken } from "@utils/auth";

export function useAuction(): {
  auction: AuctionDetailDTO | null;
  teamId: number | null;
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
  const [teamId, setTeamId] = useState<number | null>(null);
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

  const handleAuctionMessage = (message: AuctionMessageEnvelopeDTO) => {
    const rawPayload = message.payload;
    const dto = toCamelCase(rawPayload);

    switch (message.type) {
      case AuctionMessageType.INIT: {
        setError(null);
        const initPayload = dto as InitPayloadDTO;
        setAuction(initPayload.auction);
        setTeamId(initPayload.teamId);
        setMemberId(initPayload.memberId);
        break;
      }

      case AuctionMessageType.MEMBER_CONNECTED: {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                connectedMemberIds: prev.connectedMemberIds.includes(
                  dto.memberId,
                )
                  ? prev.connectedMemberIds
                  : [...prev.connectedMemberIds, dto.memberId],
              }
            : prev,
        );
        break;
      }

      case AuctionMessageType.MEMBER_DISCONNECTED: {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                connectedMemberIds: prev.connectedMemberIds.filter(
                  (id) => id !== dto.memberId,
                ),
              }
            : prev,
        );
        break;
      }

      case AuctionMessageType.NEXT_MEMBER: {
        setAuction((prev) => {
          return prev
            ? {
                ...prev,
                currentMemberId: dto.memberId,
                currentBid: null,
                auctionQueue: dto.auctionQueue,
                unsoldQueue: dto.unsoldQueue,
              }
            : prev;
        });
        break;
      }

      case AuctionMessageType.MEMBER_SOLD: {
        setAuction((prev) => {
          return prev
            ? {
                ...prev,
                teams: dto.teams,
                auctionQueue: dto.auctionQueue,
                unsoldQueue: dto.unsoldQueue,
              }
            : prev;
        });
        break;
      }

      case AuctionMessageType.MEMBER_UNSOLD: {
        setAuction((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            unsoldQueue: prev.unsoldQueue.includes(dto.memberId)
              ? prev.unsoldQueue
              : [...prev.unsoldQueue, dto.memberId],
          };
        });
        break;
      }

      case AuctionMessageType.TIMER: {
        setAuction((prev) => (prev ? { ...prev, timer: dto.timer } : null));
        break;
      }

      case AuctionMessageType.BID_PLACED: {
        setError(null);
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBid: {
              amount: dto.amount,
              leaderId: dto.leaderId,
            },
          };
        });
        break;
      }

      case AuctionMessageType.STATUS: {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                status: dto.status,
                timer: dto.status === Status.COMPLETED ? 0 : prev.timer,
                currentMemberId:
                  dto.status === Status.COMPLETED ? null : prev.currentMemberId,
                currentBid:
                  dto.status === Status.COMPLETED ? null : prev.currentBid,
              }
            : null,
        );
        break;
      }

      case AuctionMessageType.ERROR: {
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
    setTeamId(null);
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
          type: AuctionMessageType.AUTH,
          payload: authPayloadResult.data,
        } satisfies AuctionMessageEnvelopeDTO<{ access_token: string | null }>),
      );
      opened = true;
      setIsConnected(true);
      setWasConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AuctionMessageEnvelopeDTO;
        handleAuctionMessage(message);
      } catch {
        handleError(FrontendErrorCode.Validation.Invalid);
      }
    };

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      setIsConnected(false);
      const reasonCode = Number.parseInt(event.reason, 10);
      if (Number.isInteger(reasonCode) && isBackendErrorCode(reasonCode)) {
        handleError(reasonCode);
        return;
      }
      if (event.code === 1000 && opened) {
        setError(null);
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

    const message: AuctionMessageEnvelopeDTO<{ amount: number }> = {
      type: AuctionMessageType.PLACE_BID,
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
    teamId,
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

