import { useEffect, useRef, useState } from "preact/hooks";
import { MessageType } from "@/dtos/auction";
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
import {
  BidErrorCode,
  type BidErrorCodeType,
  getWsErrorMessage,
} from "@/utils/error";

interface AuctionWebSocketHook {
  state: InitDTO | null;
  connect: (auctionId: string) => void;
  placeBid: (amount: number) => void;
  isConnected: boolean;
  wasConnected: boolean;
  closeReason: string | null;
  bidReason: string | null;
  clearBidReason: () => void;
}

function isBidErrorCode(code: number): code is BidErrorCodeType {
  switch (code) {
    case BidErrorCode.TeamFull:
    case BidErrorCode.TooHigh:
    case BidErrorCode.TooLow:
    case BidErrorCode.NotLeader:
      return true;
    default:
      return false;
  }
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [state, setState] = useState<InitDTO | null>(null);
  const [closeReason, setCloseReason] = useState<string | null>(null);
  const [bidReason, setBidReason] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: AuctionMessageDTO) => {
    switch (message.type) {
      case MessageType.INIT: {
        const rawData = message.data;
        const nextState = toCamelCase<InitDTO>(rawData);
        setBidReason(null);
        setState(nextState);
        break;
      }
      case MessageType.MEMBER_CONNECTED: {
        const rawData = message.data;
        const data = toCamelCase<MemberConnectedMessageDTO>(rawData);
        const connectedMemberId = data.memberId;
        setState((prev) =>
          prev
            ? {
                ...prev,
                connectedMemberIds: prev.connectedMemberIds.includes(
                  connectedMemberId,
                )
                  ? prev.connectedMemberIds
                  : [...prev.connectedMemberIds, connectedMemberId],
              }
            : prev,
        );
        break;
      }
      case MessageType.MEMBER_DISCONNECTED: {
        const rawData = message.data;
        const data = toCamelCase<MemberDisconnectedMessageDTO>(rawData);
        const connectedMemberId = data.memberId;
        setState((prev) =>
          prev
            ? {
                ...prev,
                connectedMemberIds: prev.connectedMemberIds.filter(
                  (id) => id !== connectedMemberId,
                ),
              }
            : prev,
        );
        break;
      }

      case MessageType.NEXT_MEMBER: {
        const rawData = message.data;
        const data = toCamelCase<NextMemberMessageDTO>(rawData);
        setState((prev) => {
          return prev
            ? {
                ...prev,
                currentMemberId: data.memberId,
                currentBid: null,
                auctionQueue: data.auctionQueue,
                unsoldQueue: data.unsoldQueue,
              }
            : prev;
        });
        break;
      }

      case MessageType.MEMBER_SOLD: {
        const rawData = message.data;
        const data = toCamelCase<MemberSoldMessageDTO>(rawData);
        setState((prev) => {
          return prev
            ? {
                ...prev,
                teams: data.teams,
                auctionQueue: data.auctionQueue,
                unsoldQueue: data.unsoldQueue,
              }
            : prev;
        });
        break;
      }

      case MessageType.TIMER: {
        const rawData = message.data;
        const data = toCamelCase<TimerMessageDTO>(rawData);
        setState((prev) => (prev ? { ...prev, timer: data.timer } : null));
        break;
      }

      case MessageType.BID_PLACED: {
        const rawData = message.data;
        const data = toCamelCase<BidPlacedMessageDTO>(rawData);
        setBidReason(null);
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBid: {
              amount: data.amount,
              leaderId: data.leaderId,
            },
          };
        });
        break;
      }

      case MessageType.STATUS: {
        const rawData = message.data;
        const data = toCamelCase<StatusMessageDTO>(rawData);
        setState((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
              }
            : null,
        );
        break;
      }

      case MessageType.ERROR: {
        const rawData = message.data;
        const data = toCamelCase<ErrorMessageDTO>(rawData);
        const code = data?.code;
        if (typeof code === "number" && mountedRef.current) {
          if (isBidErrorCode(code)) {
            setBidReason(getWsErrorMessage(code));
          } else {
            setCloseReason(getWsErrorMessage(code));
          }
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
    setCloseReason(null);
    setBidReason(null);

    const token = getAccessToken();
    const url = `${AUCTION_WS_ENDPOINT}/${auctionId}`;
    const ws = new WebSocket(url);
    let opened = false;

    ws.onopen = () => {
      if (mountedRef.current) {
        ws.send(
          JSON.stringify({
            type: MessageType.AUTH,
            data: {
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
        if (event.reason) {
          setCloseReason(event.reason);
        } else if (!opened) {
          setCloseReason("서버에 연결할 수 없습니다.");
        }
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

    setBidReason(null);

    const message: AuctionMessageDTO<{ amount: number }> = {
      type: MessageType.PLACE_BID,
      data: {
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
    closeReason,
    bidReason,
    clearBidReason: () => setBidReason(null),
  };
}
