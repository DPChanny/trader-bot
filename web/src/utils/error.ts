import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "./auth";
import { queryClient, queryKeys } from "./query";

export const UNKNOWN_ERROR_MESSAGE = "알 수 없는 오류가 발생했습니다.";
export const AUCTION_CONNECTION_FAILED_MESSAGE =
  "경매 서버에 연결하지 못했습니다.";
export const AUCTION_RUNTIME_ERROR_MESSAGE =
  "경매 진행 중 오류가 발생했습니다.";

// Frontend-generated errors (never passed from server)
export const FrontendErrorCode = {
  MissingRefreshToken: 9001,
  InvalidWebSocketMessage: 9002,
  WebSocketConnectionFailed: 9003,
} as const;

export const ServerErrorCode = {
  Auth: {
    Unauthorized: 4101,
  },
  Token: {
    IncorrectJWTToken: 4102,
    ExpiredJWTToken: 4103,
    ExchangeFailed: 4104,
  },
  Validation: {
    Invalid: 4201,
  },
  Auction: {
    InsufficientLeaders: 4202,
    BidTeamFull: 4203,
    BidTooHigh: 4204,
    BidTooLow: 4205,
    ForbiddenAccess: 4301,
    BidNotLeader: 4302,
    NotFound: 4401,
  },
  Guild: {
    NotFound: 4402,
  },
  Member: {
    InsufficientRole: 4303,
    ForbiddenRole: 4304,
    NotMember: 4305,
    NotFound: 4403,
  },
  Position: {
    NotFound: 4404,
  },
  Preset: {
    NotFound: 4405,
  },
  PresetMember: {
    NotFound: 4406,
  },
  PresetMemberPosition: {
    Duplicated: 4206,
    NotFound: 4407,
  },
  Tier: {
    NotFound: 4408,
  },
  User: {
    NotFound: 4409,
  },
  Unexpected: {
    Internal: 5001,
    External: 5002,
  },
} as const;

// Backward-compatible aliases for existing imports
export const AuthErrorCode = ServerErrorCode.Auth;
export const TokenErrorCode = ServerErrorCode.Token;
export const ValidationErrorCode = ServerErrorCode.Validation;
export const AuctionErrorCode = ServerErrorCode.Auction;
export const GuildErrorCode = ServerErrorCode.Guild;
export const MemberErrorCode = ServerErrorCode.Member;
export const PositionErrorCode = ServerErrorCode.Position;
export const PresetErrorCode = ServerErrorCode.Preset;
export const PresetMemberErrorCode = ServerErrorCode.PresetMember;
export const PresetMemberPositionErrorCode =
  ServerErrorCode.PresetMemberPosition;
export const TierErrorCode = ServerErrorCode.Tier;
export const UserErrorCode = ServerErrorCode.User;
export const UnexpectedErrorCode = ServerErrorCode.Unexpected;

export function isServerErrorCode(code: number): boolean {
  const isHttpStatusCode = code >= 400 && code < 600;
  const isAppServerCode = code >= 4000 && code < 6000;
  return isHttpStatusCode || isAppServerCode;
}

export function isFrontendErrorCode(code: number): boolean {
  return (
    code === FrontendErrorCode.MissingRefreshToken ||
    code === FrontendErrorCode.InvalidWebSocketMessage ||
    code === FrontendErrorCode.WebSocketConnectionFailed
  );
}

function getErrorMessage(code: number): string {
  switch (code) {
    case AuthErrorCode.Unauthorized:
      return "로그인이 필요합니다.";
    case TokenErrorCode.IncorrectJWTToken:
      return "잘못된 토큰입니다.";
    case TokenErrorCode.ExpiredJWTToken:
      return "만료된 토큰입니다.";
    case TokenErrorCode.ExchangeFailed:
      return "토큰 갱신에 실패했습니다.";

    case ValidationErrorCode.Invalid:
      return "유효하지 않은 입력입니다.";

    case AuctionErrorCode.InsufficientLeaders:
      return "리더가 부족합니다.";
    case AuctionErrorCode.ForbiddenAccess:
      return "경매 접근 권한이 없습니다.";
    case AuctionErrorCode.NotFound:
      return "경매를 찾을 수 없습니다.";

    case AuctionErrorCode.BidTeamFull:
      return "팀 인원을 초과해 입찰할 수 없습니다.";
    case AuctionErrorCode.BidTooHigh:
      return "입찰 금액이 너무 높아 입찰할 수 없습니다.";
    case AuctionErrorCode.BidTooLow:
      return "입찰 금액이 너무 낮아 입찰할 수 없습니다.";
    case AuctionErrorCode.BidNotLeader:
      return "리더가 아니면 입찰할 수 없습니다.";

    case GuildErrorCode.NotFound:
      return "길드를 찾을 수 없습니다.";

    case MemberErrorCode.InsufficientRole:
      return "권한이 부족합니다.";
    case MemberErrorCode.ForbiddenRole:
      return "소유자 권한은 수정할 수 없습니다.";
    case MemberErrorCode.NotMember:
      return "길드의 멤버가 아닙니다.";
    case MemberErrorCode.NotFound:
      return "멤버를 찾을 수 없습니다.";

    case PositionErrorCode.NotFound:
      return "포지션을 찾을 수 없습니다.";

    case PresetErrorCode.NotFound:
      return "프리셋을 찾을 수 없습니다.";

    case PresetMemberErrorCode.NotFound:
      return "프리셋 멤버를 찾을 수 없습니다.";

    case PresetMemberPositionErrorCode.Duplicated:
      return "이미 존재하는 프리셋 멤버 포지션입니다.";
    case PresetMemberPositionErrorCode.NotFound:
      return "프리셋 멤버 포지션을 찾을 수 없습니다.";

    case TierErrorCode.NotFound:
      return "티어를 찾을 수 없습니다.";

    case UserErrorCode.NotFound:
      return "사용자를 찾을 수 없습니다.";

    case UnexpectedErrorCode.Internal:
      return "서버 내부에서 문제가 발생했습니다.";
    case UnexpectedErrorCode.External:
      return "외부 연동 중 문제가 발생했습니다.";

    case FrontendErrorCode.MissingRefreshToken:
      return "리프레시 토큰이 없어 자동 로그인에 실패했습니다.";
    case FrontendErrorCode.InvalidWebSocketMessage:
      return "실시간 메시지를 처리하지 못했습니다.";
    case FrontendErrorCode.WebSocketConnectionFailed:
      return AUCTION_CONNECTION_FAILED_MESSAGE;

    default:
      return UNKNOWN_ERROR_MESSAGE;
  }
}

export class AppError extends Error {
  readonly code: number;

  constructor(message: string, code: number, name: string) {
    super(message);
    this.code = code;
    this.name = name;
  }
}

export class HTTPError extends AppError {
  constructor(code: number) {
    super(getErrorMessage(code), code, "HTTPError");
  }
}

export class WSError extends AppError {
  constructor({ code, reason }: { code?: number; reason?: string }) {
    const parsedCode = typeof code === "number" ? code : null;
    const parsedReasonCode =
      typeof reason === "string" && /^\d+$/.test(reason.trim())
        ? Number(reason)
        : null;
    const resolvedCode =
      parsedCode ?? parsedReasonCode ?? UnexpectedErrorCode.External;
    const message =
      typeof resolvedCode === "number"
        ? getErrorMessage(resolvedCode)
        : (reason ?? UNKNOWN_ERROR_MESSAGE);
    super(message, resolvedCode, "WSError");
  }
}

export async function handleHttpError(response: Response): Promise<never> {
  if (response.status === 401) {
    removeAccessToken();
    removeRefreshToken();
    queryClient.setQueryData(queryKeys.me(), null);
    route("/");
  }

  let code: number;
  try {
    const body = await response.json();
    code = typeof body?.code === "number" ? body.code : response.status;
  } catch {
    code = response.status;
  }

  throw new HTTPError(code);
}

export interface WsErrorParams {
  code?: number;
  reason?: string;
}

export function handleWsError(params: CloseEvent): WSError;
export function handleWsError(params: WsErrorParams): WSError;
export function handleWsError(params: WsErrorParams | CloseEvent): WSError {
  let code: number | undefined;
  let reason: string | undefined;

  if (params instanceof CloseEvent) {
    code =
      params.code !== 1000 &&
      (isServerErrorCode(params.code) || isFrontendErrorCode(params.code))
        ? params.code
        : undefined;
    reason = params.reason;
  } else {
    code = params.code;
    reason = params.reason;
  }

  const reasonCode = reason ? Number(reason.trim()) : undefined;
  const parsedReasonCode =
    typeof reasonCode === "number" && Number.isInteger(reasonCode)
      ? reasonCode
      : undefined;
  const resolvedCode =
    code ??
    (parsedReasonCode !== undefined &&
    (isServerErrorCode(parsedReasonCode) ||
      isFrontendErrorCode(parsedReasonCode))
      ? parsedReasonCode
      : undefined) ??
    FrontendErrorCode.WebSocketConnectionFailed;
  const resolvedReason = reason !== reason?.trim() ? reason?.trim() : reason;

  return new WSError({
    code: resolvedCode,
    reason: resolvedReason,
  });
}
