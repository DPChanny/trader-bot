import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "@/utils/auth";
import { queryClient, queryKeys } from "@/utils/query";

export const AuthErrorCode = {
  Unauthorized: 4101,
  IncorrectJWTToken: 4102,
  ExpiredJWTToken: 4103,
  ExchangeFailed: 4104,
} as const;

export const ValidationErrorCode = {
  Invalid: 4201,
} as const;

export const AuctionErrorCode = {
  InsufficientLeaders: 4202,
  ForbiddenAccess: 4301,
  NotFound: 4401,
} as const;

export const BidErrorCode = {
  TeamFull: 4203,
  TooHigh: 4204,
  TooLow: 4205,
  NotLeader: 4302,
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
export type ValidationErrorCodeType = ValueOf<typeof ValidationErrorCode>;
export type AuctionErrorCodeType = ValueOf<typeof AuctionErrorCode>;
export type BidErrorCodeType = ValueOf<typeof BidErrorCode>;
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
  | ValidationErrorCodeType
  | AuctionErrorCodeType
  | BidErrorCodeType
  | GuildErrorCodeType
  | MemberErrorCodeType
  | PositionErrorCodeType
  | PresetErrorCodeType
  | PresetMemberErrorCodeType
  | PresetMemberPositionErrorCodeType
  | TierErrorCodeType
  | UserErrorCodeType
  | UnexpectedErrorCodeType;

export function getErrorMessage(code: number): string {
  switch (code) {
    case AuthErrorCode.Unauthorized:
      return "인증이 필요합니다.";
    case AuthErrorCode.IncorrectJWTToken:
      return "유효하지 않은 토큰입니다.";
    case AuthErrorCode.ExpiredJWTToken:
      return "토큰이 만료되었습니다.";
    case AuthErrorCode.ExchangeFailed:
      return "로그인에 실패했습니다.";

    case ValidationErrorCode.Invalid:
      return "유효하지 않은 입력입니다.";

    case AuctionErrorCode.InsufficientLeaders:
      return "팀에 리더가 부족합니다.";
    case AuctionErrorCode.ForbiddenAccess:
      return "경매에 접근 권한이 없습니다.";
    case AuctionErrorCode.NotFound:
      return "경매를 찾을 수 없습니다.";

    case BidErrorCode.TeamFull:
      return "팀 인원이 가득 찼습니다.";
    case BidErrorCode.TooHigh:
      return "입찰 금액이 보유 포인트를 초과합니다.";
    case BidErrorCode.TooLow:
      return "입찰 금액이 최솟값보다 낮습니다.";
    case BidErrorCode.NotLeader:
      return "리더만 입찰할 수 있습니다.";

    case GuildErrorCode.NotFound:
      return "길드를 찾을 수 없습니다.";

    case MemberErrorCode.InsufficientRole:
      return "권한이 부족합니다.";
    case MemberErrorCode.ForbiddenRole:
      return "해당 역할을 부여할 수 없습니다.";
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
      return "서버 오류가 발생했습니다.";
    case UnexpectedErrorCode.External:
      return "외부 연동에 실패했습니다.";

    default:
      return "알 수 없는 오류가 발생했습니다.";
  }
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
    super(getErrorMessage(code), code, "HTTPError");
    this.code = code;
  }
}

export class WSError extends AppError {
  override code: number | null;

  constructor({ code, reason }: { code?: number; reason?: string }) {
    const parsedCode = typeof code === "number" ? code : null;
    const message =
      typeof parsedCode === "number"
        ? getErrorMessage(parsedCode)
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
