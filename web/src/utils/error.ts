import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "./auth";
import { queryClient, queryKeys } from "./query";

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

type ValueOf<T> = T[keyof T];

export type AuthErrorCodeType = ValueOf<typeof AuthErrorCode>;
export type TokenErrorCodeType = ValueOf<typeof TokenErrorCode>;
export type ValidationErrorCodeType = ValueOf<typeof ValidationErrorCode>;
export type AuctionErrorCodeType = ValueOf<typeof AuctionErrorCode>;
export type GuildErrorCodeType = ValueOf<typeof GuildErrorCode>;
export type MemberErrorCodeType = ValueOf<typeof MemberErrorCode>;
export type PositionErrorCodeType = ValueOf<typeof PositionErrorCode>;
export type PresetErrorCodeType = ValueOf<typeof PresetErrorCode>;
export type PresetMemberErrorCodeType = ValueOf<typeof PresetMemberErrorCode>;
export type PresetMemberPositionErrorCodeType = ValueOf<
  typeof PresetMemberPositionErrorCode
>;
export type TierErrorCodeType = ValueOf<typeof TierErrorCode>;
export type UserErrorCodeType = ValueOf<typeof UserErrorCode>;
export type UnexpectedErrorCodeType = ValueOf<typeof UnexpectedErrorCode>;

export type AppErrorCode =
  | AuthErrorCodeType
  | TokenErrorCodeType
  | ValidationErrorCodeType
  | AuctionErrorCodeType
  | GuildErrorCodeType
  | MemberErrorCodeType
  | PositionErrorCodeType
  | PresetErrorCodeType
  | PresetMemberErrorCodeType
  | PresetMemberPositionErrorCodeType
  | TierErrorCodeType
  | UserErrorCodeType
  | UnexpectedErrorCodeType;

export interface ErrorDetail {
  code: number;
  message: string;
}

export function getErrorDetail(code: number): ErrorDetail {
  let message: string;

  switch (code) {
    case AuthErrorCode.Unauthorized:
      message = "인증이 필요합니다.";
      break;
    case TokenErrorCode.IncorrectJWTToken:
      message = "유효하지 않은 토큰입니다.";
      break;
    case TokenErrorCode.ExpiredJWTToken:
      message = "토큰이 만료되었습니다.";
      break;
    case TokenErrorCode.ExchangeFailed:
      message = "로그인에 실패했습니다.";
      break;

    case ValidationErrorCode.Invalid:
      message = "유효하지 않은 입력입니다.";
      break;

    case AuctionErrorCode.InsufficientLeaders:
      message = "팀에 리더가 부족합니다.";
      break;
    case AuctionErrorCode.ForbiddenAccess:
      message = "경매에 접근 권한이 없습니다.";
      break;
    case AuctionErrorCode.NotFound:
      message = "경매를 찾을 수 없습니다.";
      break;

    case AuctionErrorCode.BidTeamFull:
      message = "팀 인원이 가득 찼습니다.";
      break;
    case AuctionErrorCode.BidTooHigh:
      message = "입찰 금액이 보유 포인트를 초과합니다.";
      break;
    case AuctionErrorCode.BidTooLow:
      message = "입찰 금액이 최솟값보다 낮습니다.";
      break;
    case AuctionErrorCode.BidNotLeader:
      message = "리더만 입찰할 수 있습니다.";
      break;

    case GuildErrorCode.NotFound:
      message = "길드를 찾을 수 없습니다.";
      break;

    case MemberErrorCode.InsufficientRole:
      message = "권한이 부족합니다.";
      break;
    case MemberErrorCode.ForbiddenRole:
      message = "해당 역할을 부여할 수 없습니다.";
      break;
    case MemberErrorCode.NotMember:
      message = "길드의 멤버가 아닙니다.";
      break;
    case MemberErrorCode.NotFound:
      message = "멤버를 찾을 수 없습니다.";
      break;

    case PositionErrorCode.NotFound:
      message = "포지션을 찾을 수 없습니다.";
      break;

    case PresetErrorCode.NotFound:
      message = "프리셋을 찾을 수 없습니다.";
      break;

    case PresetMemberErrorCode.NotFound:
      message = "프리셋 멤버를 찾을 수 없습니다.";
      break;

    case PresetMemberPositionErrorCode.Duplicated:
      message = "이미 존재하는 프리셋 멤버 포지션입니다.";
      break;
    case PresetMemberPositionErrorCode.NotFound:
      message = "프리셋 멤버 포지션을 찾을 수 없습니다.";
      break;

    case TierErrorCode.NotFound:
      message = "티어를 찾을 수 없습니다.";
      break;

    case UserErrorCode.NotFound:
      message = "사용자를 찾을 수 없습니다.";
      break;

    case UnexpectedErrorCode.Internal:
      message = "서버 오류가 발생했습니다.";
      break;
    case UnexpectedErrorCode.External:
      message = "외부 연동에 실패했습니다.";
      break;

    default:
      message = "알 수 없는 오류가 발생했습니다.";
      break;
  }

  return { code, message };
}

export class AppError extends Error {
  code: number | null;

  constructor(message: string, code: number | null, name: string) {
    super(message);
    this.code = code;
    this.name = name;
  }
}

export class HTTPError extends AppError {
  override code: number;

  constructor(code: number) {
    const detail = getErrorDetail(code);
    super(detail.message, detail.code, "HTTPError");
    this.code = detail.code;
  }
}

export class WSError extends AppError {
  override code: number | null;

  constructor({ code, reason }: { code?: number; reason?: string }) {
    const parsedCode = typeof code === "number" ? code : null;
    const message =
      typeof parsedCode === "number"
        ? getErrorDetail(parsedCode).message
        : (reason ?? "웹소켓 오류가 발생했습니다.");
    super(message, parsedCode, "WSError");
    this.code = parsedCode;
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
