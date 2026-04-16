export const FrontendErrorCode = {
  Auction: {
    InvalidMessage: 9201,
    Disconnected: 9202,
  },
  Unexpected: {
    Internal: 9501,
    External: 9502,
  },
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
  return code >= 9000 && code < 10000;
}

function getErrorMessage(code: number): string {
  switch (code) {
    case BackendErrorCode.Auth.Unauthorized:
      return "로그인이 필요합니다";
    case BackendErrorCode.Token.IncorrectJWTToken:
      return "잘못된 인증 토큰입니다";
    case BackendErrorCode.Token.ExpiredJWTToken:
      return "만료된 인증 토큰입니다";
    case BackendErrorCode.Token.ExchangeFailed:
      return "인증 토큰 교환에 실패했습니다";

    case BackendErrorCode.Validation.Invalid:
      return "유효하지 않은 입력입니다";

    case BackendErrorCode.Auction.InsufficientLeaders:
      return "팀장이 부족합니다";
    case BackendErrorCode.Auction.ForbiddenAccess:
      return "경매 접근 권한이 없습니다";
    case BackendErrorCode.Auction.NotFound:
      return "경매를 찾을 수 없습니다";

    case BackendErrorCode.Auction.BidTeamFull:
      return "팀 인원을 초과해 입찰할 수 없습니다";
    case BackendErrorCode.Auction.BidTooHigh:
      return "입찰 금액이 너무 높아 입찰할 수 없습니다";
    case BackendErrorCode.Auction.BidTooLow:
      return "입찰 금액이 너무 낮아 입찰할 수 없습니다";
    case BackendErrorCode.Auction.BidNotLeader:
      return "팀장이 아니면 입찰할 수 없습니다";

    case BackendErrorCode.Guild.NotFound:
      return "길드를 찾을 수 없습니다";

    case BackendErrorCode.Member.InsufficientRole:
      return "권한이 부족합니다";
    case BackendErrorCode.Member.ForbiddenRole:
      return "소유자 권한은 수정할 수 없습니다";
    case BackendErrorCode.Member.NotMember:
      return "길드의 멤버가 아닙니다";
    case BackendErrorCode.Member.NotFound:
      return "멤버를 찾을 수 없습니다";

    case BackendErrorCode.Position.NotFound:
      return "포지션을 찾을 수 없습니다";

    case BackendErrorCode.Preset.NotFound:
      return "프리셋을 찾을 수 없습니다";

    case BackendErrorCode.PresetMember.NotFound:
      return "프리셋 멤버를 찾을 수 없습니다";

    case BackendErrorCode.PresetMemberPosition.Duplicated:
      return "이미 존재하는 프리셋 멤버 포지션입니다";
    case BackendErrorCode.PresetMemberPosition.NotFound:
      return "프리셋 멤버 포지션을 찾을 수 없습니다";

    case BackendErrorCode.Tier.NotFound:
      return "티어를 찾을 수 없습니다";

    case BackendErrorCode.User.NotFound:
      return "사용자를 찾을 수 없습니다";

    case BackendErrorCode.Unexpected.Internal:
      return "서버 내부에서 예기치 못한 문제가 발생했습니다";
    case BackendErrorCode.Unexpected.External:
      return "서버 외부에서 예기치 못한 문제가 발생했습니다";

    case FrontendErrorCode.Auction.InvalidMessage:
      return "경매 메시지를 처리하지 못했습니다";
    case FrontendErrorCode.Auction.Disconnected:
      return "경매 서버 연결이 끊겼습니다";

    case FrontendErrorCode.Unexpected.Internal:
      return "클라이언트 내부에서 예기치 못한 문제가 발생했습니다";
    case FrontendErrorCode.Unexpected.External:
      return "클라이언트 외부에서 예기치 못한 문제가 발생했습니다";

    default:
      return "알 수 없는 오류가 발생했습니다";
  }
}

export class AppError extends Error {
  readonly code: number;

  constructor(code: number, name = "AppError") {
    super(getErrorMessage(code));
    this.code = code;
    this.name = name;
  }
}

export class HTTPError extends AppError {
  constructor(code: number) {
    super(code, "HTTPError");
  }
}

export class WSError extends AppError {
  constructor(code: number) {
    super(code, "WSError");
  }
}

export function handleAppError(code: number): never {
  throw new AppError(code);
}

export async function handleHTTPError(response: Response): Promise<never> {
  let code: number;
  try {
    const body = await response.json();
    code = typeof body?.code === "number" ? body.code : response.status;
  } catch {
    code = response.status;
  }

  throw new HTTPError(code);
}

export function handleWSError(code: number): never {
  throw new WSError(code);
}
