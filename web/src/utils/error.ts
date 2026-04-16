import { route } from "preact-router";
import { removeAccessToken, removeRefreshToken } from "./auth";
import { queryClient, queryKeys } from "./query";

export const FrontendErrorCode = {
  MissingRefreshToken: 9001,
  InvalidWebSocketMessage: 9002,
  WebSocketConnectionFailed: 9003,
} as const;

export const BackendErrorCode = {
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

export function isBackendErrorCode(code: number): boolean {
  return (code >= 400 && code < 600) || (code >= 4000 && code < 6000);
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
    case BackendErrorCode.Auth.Unauthorized:
      return "로그인이 필요합니다.";
    case BackendErrorCode.Token.IncorrectJWTToken:
      return "잘못된 토큰입니다.";
    case BackendErrorCode.Token.ExpiredJWTToken:
      return "만료된 토큰입니다.";
    case BackendErrorCode.Token.ExchangeFailed:
      return "토큰 갱신에 실패했습니다.";

    case BackendErrorCode.Validation.Invalid:
      return "유효하지 않은 입력입니다.";

    case BackendErrorCode.Auction.InsufficientLeaders:
      return "리더가 부족합니다.";
    case BackendErrorCode.Auction.ForbiddenAccess:
      return "경매 접근 권한이 없습니다.";
    case BackendErrorCode.Auction.NotFound:
      return "경매를 찾을 수 없습니다.";

    case BackendErrorCode.Auction.BidTeamFull:
      return "팀 인원을 초과해 입찰할 수 없습니다.";
    case BackendErrorCode.Auction.BidTooHigh:
      return "입찰 금액이 너무 높아 입찰할 수 없습니다.";
    case BackendErrorCode.Auction.BidTooLow:
      return "입찰 금액이 너무 낮아 입찰할 수 없습니다.";
    case BackendErrorCode.Auction.BidNotLeader:
      return "리더가 아니면 입찰할 수 없습니다.";

    case BackendErrorCode.Guild.NotFound:
      return "길드를 찾을 수 없습니다.";

    case BackendErrorCode.Member.InsufficientRole:
      return "권한이 부족합니다.";
    case BackendErrorCode.Member.ForbiddenRole:
      return "소유자 권한은 수정할 수 없습니다.";
    case BackendErrorCode.Member.NotMember:
      return "길드의 멤버가 아닙니다.";
    case BackendErrorCode.Member.NotFound:
      return "멤버를 찾을 수 없습니다.";

    case BackendErrorCode.Position.NotFound:
      return "포지션을 찾을 수 없습니다.";

    case BackendErrorCode.Preset.NotFound:
      return "프리셋을 찾을 수 없습니다.";

    case BackendErrorCode.PresetMember.NotFound:
      return "프리셋 멤버를 찾을 수 없습니다.";

    case BackendErrorCode.PresetMemberPosition.Duplicated:
      return "이미 존재하는 프리셋 멤버 포지션입니다.";
    case BackendErrorCode.PresetMemberPosition.NotFound:
      return "프리셋 멤버 포지션을 찾을 수 없습니다.";

    case BackendErrorCode.Tier.NotFound:
      return "티어를 찾을 수 없습니다.";

    case BackendErrorCode.User.NotFound:
      return "사용자를 찾을 수 없습니다.";

    case BackendErrorCode.Unexpected.Internal:
      return "서버 내부에서 문제가 발생했습니다.";
    case BackendErrorCode.Unexpected.External:
      return "외부 연동 중 문제가 발생했습니다.";

    case FrontendErrorCode.MissingRefreshToken:
      return "리프레시 토큰이 없어 자동 로그인에 실패했습니다.";
    case FrontendErrorCode.InvalidWebSocketMessage:
      return "실시간 메시지를 처리하지 못했습니다.";
    case FrontendErrorCode.WebSocketConnectionFailed:
      return "경매 서버에 연결하지 못했습니다.";

    default:
      return "알 수 없는 오류가 발생했습니다.";
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
  constructor(code: number) {
    super(getErrorMessage(code), code, "WSError");
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

export function handleWsError(code: number): never {
  throw new WSError(code);
}
