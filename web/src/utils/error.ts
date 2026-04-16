import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "./auth";
import { queryClient, queryKeys } from "./query";

export const UNKNOWN_ERROR_MESSAGE = "알 수 없는 오류가 발생했습니다.";
export const AUCTION_CONNECTION_FAILED_MESSAGE =
  "경매 서버에 연결하지 못했습니다.";
export const AUCTION_RUNTIME_ERROR_MESSAGE =
  "경매 진행 중 오류가 발생했습니다.";

export const AuthErrorCode = {
  Unauthorized: 4101,
} as const;

export const TokenErrorCode = {
  IncorrectJWTToken: 4102,
  ExpiredJWTToken: 4103,
  ExchangeFailed: 4104,
} as const;

export const ValidationErrorCode = {
  Invalid: 4201,
} as const;

export const AuctionErrorCode = {
  InsufficientLeaders: 4202,
  BidTeamFull: 4203,
  BidTooHigh: 4204,
  BidTooLow: 4205,
  ForbiddenAccess: 4301,
  BidNotLeader: 4302,
  NotFound: 4401,
} as const;

export const GuildErrorCode = {
  NotFound: 4402,
} as const;

export const MemberErrorCode = {
  InsufficientRole: 4303,
  ForbiddenRole: 4304,
  NotMember: 4305,
  NotFound: 4403,
} as const;

export const PresetErrorCode = {
  NotFound: 4405,
} as const;

export const TierErrorCode = {
  NotFound: 4408,
} as const;

export const UserErrorCode = {
  NotFound: 4409,
} as const;

export const UnexpectedErrorCode = {
  Internal: 5001,
  External: 5002,
} as const;

export const PositionErrorCode = {
  NotFound: 4404,
} as const;

export const PresetMemberErrorCode = {
  NotFound: 4406,
} as const;

export const PresetMemberPositionErrorCode = {
  Duplicated: 4206,
  NotFound: 4407,
} as const;

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

    default:
      return UNKNOWN_ERROR_MESSAGE;
  }
}

export class AppError extends Error {
  code: number;

  constructor(message: string, code: number, name: string) {
    super(message);
    this.code = code;
    this.name = name;
  }
}

export class HTTPError extends AppError {
  override code: number;

  constructor(code: number) {
    super(getErrorMessage(code), code, "HTTPError");
    this.code = code;
  }
}

export class WSError extends AppError {
  override code: number;

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
    this.code = resolvedCode;
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

export function handleWsError(params: WsErrorParams | CloseEvent): WSError {
  let code: number | undefined;
  let reason: string | undefined;

  if (params instanceof CloseEvent) {
    code = params.code === 1000 ? undefined : params.code;
    reason = params.reason;
  } else {
    code = params.code;
    reason = params.reason;
  }

  const resolvedCode = code ?? (reason ? parseInt(reason, 10) : undefined);
  const resolvedReason = reason !== reason?.trim() ? reason?.trim() : reason;

  return new WSError({
    code: resolvedCode,
    reason: resolvedReason,
  });
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof globalThis.Error) {
    // 일반 Error는 UnexpectedErrorCode.External로 변환
    return new AppError(
      error.message,
      UnexpectedErrorCode.External,
      error.name,
    );
  }

  // Error가 아닌 경우도 처리
  const message =
    typeof error === "string" ? error : String(error ?? UNKNOWN_ERROR_MESSAGE);
  return new AppError(message, UnexpectedErrorCode.External, "UnknownError");
}
