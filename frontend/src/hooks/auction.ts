import { useMutation, type UseMutationResult } from "@tanstack/preact-query";
import { useEffect, useRef, useState } from "preact/hooks";
import { createAuction } from "@apis/auction";
import { Status, AuctionMessageType } from "@dtos/auction";
import type {
  AuctionDetailDTO,
  AuctionMessageEnvelopeDTO,
  InitPayloadDTO,
} from "@dtos/auction";
import { AuthPayloadSchema, PlaceBidPayloadSchema } from "@dtos/auction";
import type { AppError } from "@utils/error";
import {
  FrontendErrorCode,
  handleWSError,
  WSError,
  isBackendErrorCode,
} from "@utils/error";
import { toCamelCase } from "@utils/dto";
import { AUCTION_WS_ENDPOINT } from "@utils/env";
import { getAccessToken } from "@utils/auth";

export function useAuction(): {
  auction: AuctionDetailDTO | null;
  teamId: number | null;
  memberId: number | null;
  connect: (auctionId: string) => void;
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

  const connect = (auctionId: string) => {
    wsRef.current?.close();
    setIsConnected(false);
    setError(null);

    const token = getAccessToken();
    const url = `${AUCTION_WS_ENDPOINT}/${auctionId}`;
    const ws = new WebSocket(url);
    let opened = false;

    ws.onopen = () => {
      const auth_payload_result = AuthPayloadSchema.safeParse({
        token: token,
      });
      if (!auth_payload_result.success) {
        return;
      }

      ws.send(
        JSON.stringify({
          type: AuctionMessageType.AUTH,
          payload: auth_payload_result.data,
        } satisfies AuctionMessageEnvelopeDTO<{ token: string | null }>),
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

    const place_bid_payload_result = PlaceBidPayloadSchema.safeParse({
      amount: amount,
    });
    if (!place_bid_payload_result.success) {
      return;
    }

    const message: AuctionMessageEnvelopeDTO<{ amount: number }> = {
      type: AuctionMessageType.PLACE_BID,
      payload: place_bid_payload_result.data,
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
