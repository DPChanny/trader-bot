import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "./auth";
import { queryClient, queryKeys } from "./query";

const AuthErrorCode = {
  Unauthorized: 4101,
} as const;

const TokenErrorCode = {
  IncorrectJWTToken: 4102,
  ExpiredJWTToken: 4103,
  ExchangeFailed: 4104,
} as const;

const ValidationErrorCode = {
  Invalid: 4201,
} as const;

const AuctionErrorCode = {
  InsufficientLeaders: 4202,
  BidTeamFull: 4203,
  BidTooHigh: 4204,
  BidTooLow: 4205,
  ForbiddenAccess: 4301,
  BidNotLeader: 4302,
  NotFound: 4401,
} as const;

const GuildErrorCode = {
  NotFound: 4402,
} as const;

const MemberErrorCode = {
  InsufficientRole: 4303,
  ForbiddenRole: 4304,
  NotMember: 4305,
  NotFound: 4403,
} as const;

const PresetErrorCode = {
  NotFound: 4405,
} as const;

const TierErrorCode = {
  NotFound: 4408,
} as const;

const UserErrorCode = {
  NotFound: 4409,
} as const;

const UnexpectedErrorCode = {
  Internal: 5001,
  External: 5002,
} as const;

const PositionErrorCode = {
  NotFound: 4404,
} as const;

const PresetMemberErrorCode = {
  NotFound: 4406,
} as const;

const PresetMemberPositionErrorCode = {
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
      return "서버 내부에서 예기치 못한 오류가 발생했습니다.";
    case UnexpectedErrorCode.External:
      return "외부 연동에서 예기치 못한 오류가 발생했습니다.";

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
