import { useEffect, useRef, useState } from "preact/hooks";
import type {
  AuctionInitDTO,
  BidPlacedMessageData,
  NextMemberMessageData,
  QueueUpdateMessageData,
  TimerMessageData,
  MemberSoldMessageData,
  WebSocketMessage,
} from "@/dtos";
import { toCamelCase } from "@/utils/dto";
import { AUCTION_WS_ENDPOINT } from "@/utils/endpoint";

interface AuctionWebSocketHook {
  isConnected: boolean;
  wasConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  placeBid: (amount: number) => void;
  state: AuctionInitDTO | null;
  isLeader: boolean;
  userId: number | null;
  teamId: number | null;
  connectedUsers: number[];
  closeReason: string | null;
}

export function useAuctionWebSocket(): AuctionWebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [state, setState] = useState<AuctionInitDTO | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<number[]>([]);
  const [closeReason, setCloseReason] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const accessCodeRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "init": {
        const rawData = message.data;
        const data = toCamelCase<AuctionInitDTO>(rawData);
        setIsLeader(data.isLeader);
        setUserId(data.userId);
        setTeamId(data.teamId);
        setConnectedUsers(data.connectedUsers);

        setState(data);
        break;
      }
      case "user_connected": {
        const userId = message.data.user_id;
        setConnectedUsers((prev) => {
          if (prev.includes(userId)) return prev;
          return [...prev, userId];
        });
        break;
      }
      case "user_disconnected": {
        const userId = message.data.user_id;
        setConnectedUsers((prev) => prev.filter((id) => id !== userId));
        break;
      }

      case "next_member": {
        const data = toCamelCase<NextMemberMessageData>(message.data);
        setState((prev) =>
          prev
            ? {
                ...prev,
                currentMemberId: data.memberId,
                currentBid: null,
                currentBidder: null,
              }
            : null,
        );
        break;
      }

      case "queue_update": {
        const data = toCamelCase<QueueUpdateMessageData>(message.data);
        setState((prev) =>
          prev
            ? {
                ...prev,
                auctionQueue: data.auctionQueue,
                unsoldQueue: data.unsoldQueue,
              }
            : null,
        );
        break;
      }

      case "timer": {
        const data = toCamelCase<TimerMessageData>(message.data);
        setState((prev) => (prev ? { ...prev, timer: data.timer } : null));
        break;
      }

      case "bid_placed": {
        const data = toCamelCase<BidPlacedMessageData>(message.data);
        setState((prev) =>
          prev
            ? {
                ...prev,
                currentBid: data.amount,
                currentBidder: data.teamId,
              }
            : null,
        );
        break;
      }

      case "member_sold": {
        const data = toCamelCase<MemberSoldMessageData>(message.data);
        setState((prev) =>
          prev
            ? {
                ...prev,
                teams: data.teams,
              }
            : null,
        );
        break;
      }

      case "member_unsold": {
        break;
      }

      case "status": {
        const data = message.data as {
          status: "waiting" | "in_progress" | "completed";
        };
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

      case "error":
        break;

      default:
        break;
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      sessionIdRef.current = null;
      accessCodeRef.current = null;
      setIsConnected(false);
      setState(null);
      setCloseReason(null);
    }
  };

  const connect = (token: string) => {
    disconnect();
    setCloseReason(null);

    const url = `${AUCTION_WS_ENDPOINT}/${token}`;
    const ws = new WebSocket(url);
    let opened = false;

    ws.onopen = () => {
      if (mountedRef.current) {
        opened = true;
        setIsConnected(true);
        setWasConnected(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
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
          setCloseReason("유효하지 않은 토큰이거나 서버에 연결할 수 없습니다.");
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

    const message = {
      type: "place_bid",
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
      disconnect();
    };
  }, []);

  return {
    isConnected,
    wasConnected,
    connect,
    disconnect,
    placeBid,
    state,
    isLeader,
    userId,
    teamId,
    closeReason,
    connectedUsers,
  };
}
