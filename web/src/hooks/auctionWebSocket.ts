import { useEffect, useRef, useState } from "preact/hooks";
import { Status, AuctionMessageType } from "@dtos/auction";
import type { AuctionMessageEnvelopeDTO, InitPayloadDTO } from "@dtos/auction";
import { AuthPayloadSchema, PlaceBidPayloadSchema } from "@dtos/auction";
import { toCamelCase } from "@utils/dto";
import { AUCTION_WS_ENDPOINT } from "@utils/env";
import { getAccessToken } from "@utils/auth";
import { WSError } from "@utils/error";

interface AuctionWebSocketHook {
  state: InitPayloadDTO | null;
  connect: (auctionId: string) => void;
  placeBid: (amount: number) => void;
  isConnected: boolean;
  wasConnected: boolean;
  error: WSError | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [state, setState] = useState<InitPayloadDTO | null>(null);
  const [error, setError] = useState<WSError | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: AuctionMessageEnvelopeDTO) => {
    const rawPayload = message.payload;
    const dto = toCamelCase(rawPayload);

    switch (message.type) {
      case AuctionMessageType.INIT: {
        setError(null);
        setState(dto as InitPayloadDTO);
        break;
      }
      case AuctionMessageType.MEMBER_CONNECTED: {
        setState((prev) =>
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
        setState((prev) =>
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
        setState((prev) => {
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
        setState((prev) => {
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
        setState((prev) => (prev ? { ...prev, timer: dto.timer } : null));
        break;
      }

      case AuctionMessageType.BID_PLACED: {
        setError(null);
        setState((prev) => {
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
        setState((prev) =>
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
        const code = dto?.code;
        if (typeof code === "number" && mountedRef.current) {
          setError(new WSError({ code }));
        }
        break;
      }

      default:
        break;
    }
  };

  const cleanupConnection = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const connect = (auctionId: string) => {
    cleanupConnection();
    setError(null);

    const token = getAccessToken();
    const url = `${AUCTION_WS_ENDPOINT}/${auctionId}`;
    const ws = new WebSocket(url);
    let opened = false;

    ws.onopen = () => {
      if (mountedRef.current) {
        const auth_payload_result = AuthPayloadSchema.safeParse({
          token: token,
        });
        if (!auth_payload_result.success) {
          console.error(
            "Invalid AUTH payload",
            auth_payload_result.error.flatten(),
          );
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
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AuctionMessageEnvelopeDTO;
        if (mountedRef.current) {
          handleWebSocketMessage(message);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      if (mountedRef.current) {
        setIsConnected(false);
        setError((prev) => {
          if (prev) return prev;
          if (event.reason) {
            return new WSError({ reason: event.reason });
          }
          if (!opened) {
            return new WSError({ reason: "서버에 연결할 수 없습니다." });
          }
          return null;
        });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (mountedRef.current) {
        setIsConnected(false);
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
      console.error(
        "Invalid PLACE_BID payload",
        place_bid_payload_result.error.flatten(),
      );
      return;
    }

    const message: AuctionMessageEnvelopeDTO<{ amount: number }> = {
      type: AuctionMessageType.PLACE_BID,
      payload: place_bid_payload_result.data,
    };

    wsRef.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupConnection();
    };
  }, []);

  return {
    state,
    connect,
    placeBid,
    isConnected,
    wasConnected,
    error,
  };
}
