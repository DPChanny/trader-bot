import { useEffect, useRef, useState } from "preact/hooks";
import { AuctionStatus, MessageType } from "@/dtos/auction";
import type {
  AuctionMessageDTO,
  InitDTO,
  BidPlacedMessageDTO,
  ErrorMessageDTO,
  MemberConnectedMessageDTO,
  MemberDisconnectedMessageDTO,
  MemberSoldMessageDTO,
  NextMemberMessageDTO,
  StatusMessageDTO,
  TimerMessageDTO,
} from "@/dtos/auction";
import { toCamelCase } from "@/utils/dto";
import { AUCTION_WS_ENDPOINT } from "@/utils/env";
import { getAccessToken } from "@/utils/auth";
import { WSError } from "@/utils/error";

interface AuctionWebSocketHook {
  state: InitDTO | null;
  connect: (auctionId: string) => void;
  placeBid: (amount: number) => void;
  isConnected: boolean;
  wasConnected: boolean;
  error: WSError | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [state, setState] = useState<InitDTO | null>(null);
  const [error, setError] = useState<WSError | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: AuctionMessageDTO) => {
    const rawPayload = message.payload;

    switch (message.type) {
      case MessageType.INIT: {
        const nextState = toCamelCase<InitDTO>(rawPayload);
        setError(null);
        setState(nextState);
        break;
      }
      case MessageType.MEMBER_CONNECTED: {
        const dto = toCamelCase<MemberConnectedMessageDTO>(rawPayload);
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
      case MessageType.MEMBER_DISCONNECTED: {
        const dto = toCamelCase<MemberDisconnectedMessageDTO>(rawPayload);
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

      case MessageType.NEXT_MEMBER: {
        const dto = toCamelCase<NextMemberMessageDTO>(rawPayload);
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

      case MessageType.MEMBER_SOLD: {
        const dto = toCamelCase<MemberSoldMessageDTO>(rawPayload);
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

      case MessageType.TIMER: {
        const dto = toCamelCase<TimerMessageDTO>(rawPayload);
        setState((prev) => (prev ? { ...prev, timer: dto.timer } : null));
        break;
      }

      case MessageType.BID_PLACED: {
        const dto = toCamelCase<BidPlacedMessageDTO>(rawPayload);
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

      case MessageType.STATUS: {
        const dto = toCamelCase<StatusMessageDTO>(rawPayload);
        setState((prev) =>
          prev
            ? {
                ...prev,
                status: dto.status,
                timer: dto.status === AuctionStatus.COMPLETED ? 0 : prev.timer,
                currentMemberId:
                  dto.status === AuctionStatus.COMPLETED
                    ? null
                    : prev.currentMemberId,
                currentBid:
                  dto.status === AuctionStatus.COMPLETED
                    ? null
                    : prev.currentBid,
              }
            : null,
        );
        break;
      }

      case MessageType.ERROR: {
        const dto = toCamelCase<ErrorMessageDTO>(rawPayload);
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
        ws.send(
          JSON.stringify({
            type: MessageType.AUTH,
            payload: {
              token: token,
            },
          } satisfies AuctionMessageDTO<{ token: string | null }>),
        );
        opened = true;
        setIsConnected(true);
        setWasConnected(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AuctionMessageDTO;
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

    const message: AuctionMessageDTO<{ amount: number }> = {
      type: MessageType.PLACE_BID,
      payload: {
        amount: amount,
      },
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
