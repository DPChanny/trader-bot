import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "@/utils/auth";
import { queryClient, queryKeys } from "@/utils/query";

export const AuctionErrorCode = {
  InsufficientLeaders: 4001,
  BidTeamFull: 4002,
  BidTooHigh: 4003,
  BidTooLow: 4004,
  ForbiddenAccess: 4301,
  BidNotLeader: 4302,
  NotFound: 4401,
} as const;

export const AuthErrorCode = {
  Unauthorized: 4101,
  IncorrectJWTToken: 4102,
  ExpiredJWTToken: 4103,
  ExchangeFailed: 4104,
} as const;

export const ValidationErrorCode = {
  Invalid: 4201,
  Duplicated: 4202,
} as const;

export const DiscordErrorCode = {
  ExchangeFailed: 4501,
  FetchFailed: 4502,
} as const;

export const UserErrorCode = {
  NotFound: 4402,
} as const;

export const GuildErrorCode = {
  NotFound: 4403,
} as const;

export const MemberErrorCode = {
  InsufficientRole: 4303,
  ForbiddenRole: 4304,
  NotFound: 4404,
} as const;

export const PresetErrorCode = {
  NotFound: 4405,
} as const;

export const TierErrorCode = {
  NotFound: 4406,
} as const;

export const PositionErrorCode = {
  NotFound: 4407,
} as const;

export const PresetMemberErrorCode = {
  NotFound: 4408,
} as const;

export const PresetMemberPositionErrorCode = {
  NotFound: 4409,
} as const;

export const UnexpectedErrorCode = {
  Internal: 5001,
} as const;

export function getErrorMessage(code: number): string {
  switch (code) {
    case AuctionErrorCode.InsufficientLeaders:
      return "팀에 리더가 부족합니다.";
    case AuctionErrorCode.BidTeamFull:
      return "팀 인원이 가득 찼습니다.";
    case AuctionErrorCode.BidTooHigh:
      return "입찰 금액이 보유 포인트를 초과합니다.";
    case AuctionErrorCode.BidTooLow:
      return "입찰 금액이 최솟값보다 낮습니다.";
    case AuctionErrorCode.ForbiddenAccess:
      return "경매에 접근 권한이 없습니다.";
    case AuctionErrorCode.BidNotLeader:
      return "리더만 입찰할 수 있습니다.";
    case AuctionErrorCode.NotFound:
      return "경매를 찾을 수 없습니다.";

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
    case ValidationErrorCode.Duplicated:
      return "이미 존재하는 항목입니다.";

    case MemberErrorCode.InsufficientRole:
      return "권한이 부족합니다.";
    case MemberErrorCode.ForbiddenRole:
      return "해당 역할을 부여할 수 없습니다.";

    case UserErrorCode.NotFound:
      return "사용자를 찾을 수 없습니다.";
    case GuildErrorCode.NotFound:
      return "서버를 찾을 수 없습니다.";
    case MemberErrorCode.NotFound:
      return "멤버를 찾을 수 없습니다.";
    case PresetErrorCode.NotFound:
      return "프리셋을 찾을 수 없습니다.";
    case TierErrorCode.NotFound:
      return "티어를 찾을 수 없습니다.";
    case PositionErrorCode.NotFound:
      return "포지션을 찾을 수 없습니다.";
    case PresetMemberErrorCode.NotFound:
      return "프리셋 멤버를 찾을 수 없습니다.";
    case PresetMemberPositionErrorCode.NotFound:
      return "프리셋 멤버 포지션을 찾을 수 없습니다.";

    case DiscordErrorCode.ExchangeFailed:
      return "Discord 인증에 실패했습니다.";
    case DiscordErrorCode.FetchFailed:
      return "Discord 정보를 불러오는 데 실패했습니다.";

    case UnexpectedErrorCode.Internal:
      return "서버 오류가 발생했습니다.";

    default:
      return "알 수 없는 오류가 발생했습니다.";
  }
}

export function getWsErrorMessage(code: number): string {
  return getErrorMessage(code);
}

export class AppError extends Error {
  code: number;

  constructor(code: number) {
    super(getErrorMessage(code));
    this.code = code;
    this.name = "AppError";
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

  throw new AppError(code);
}
