export const FrontendErrorCode = {
  Validation: {
    Invalid: 9101,
  },
  Connection: {
    Kicked: 9201,
  },
  Toss: {
    BillingAuth: {
      InvalidCardNumber: 9601,
      InvalidCardExpiration: 9602,
      InvalidCardPassword: 9603,
      InvalidCardIdentity: 9604,
      InvalidStoppedCard: 9605,
      InvalidRejectCard: 9606,
      NotSupportedCardType: 9607,
      ExceedMaxAuthCount: 9608,
      RejectCardCompany: 9609,
      InvalidBirthDayFormat: 9610,
      NotRegisteredCardCompany: 9611,
      CommonError: 9612,
    },
  },
  Unexpected: {
    Internal: 9501,
    External: 9502,
  },
} as const;

export const BackendErrorCode = {
  Unauthorized: {
    Generic: 40100,
    Auth: 40101,
    IncorrectToken: 40102,
    ExpiredToken: 40103,
    ConsumedToken: 40104,
  },
  Forbidden: {
    Generic: 40300,
    Auction: {
      BidNotLeader: 40301,
    },
    Member: {
      InsufficientRole: 40302,
      ForbiddenRole: 40303,
      NotMember: 40304,
    },
    Subscription: {
      InsufficientPlan: 40305,
      InsufficientQuota: 40306,
    },
  },
  NotFound: {
    Generic: 40400,
    Auction: 40401,
    Guild: 40402,
    Member: 40403,
    Position: 40404,
    Preset: 40405,
    PresetMember: 40406,
    PresetMemberPosition: 40407,
    Tier: 40408,
    User: 40409,
    Subscription: 40410,
    Billing: 40411,
  },
  Invalid: {
    Generic: 42200,
    Request: 42201,
    Auction: {
      BidTeamFull: 42202,
      BidTooLow: 42203,
      BidDuplicate: 42204,
      BidTooHigh: 42205,
    },
    PresetMemberPosition: {
      Duplicated: 42206,
    },
  },
  Unexpected: {
    Generic: 50000,
    Internal: 50001,
    External: 50002,
  },
} as const;

export function isBackendErrorCode(code: number): boolean {
  return code >= 40000 && code < 60000;
}

export function isFrontendErrorCode(code: number): boolean {
  return code >= 9000 && code < 10000;
}

function getErrorMessage(code: number): string {
  switch (code) {
    case BackendErrorCode.Unauthorized.Auth:
      return "로그인이 필요합니다";
    case BackendErrorCode.Unauthorized.IncorrectToken:
      return "잘못된 JWT 토큰입니다";
    case BackendErrorCode.Unauthorized.ExpiredToken:
      return "만료된 JWT 토큰입니다";
    case BackendErrorCode.Unauthorized.ConsumedToken:
      return "토큰 사용에 실패했습니다";

    case BackendErrorCode.Invalid.Request:
      return "유효하지 않은 입력입니다";

    case BackendErrorCode.Invalid.Auction.BidTeamFull:
      return "팀 인원이 가득 차 입찰할 수 없습니다";
    case BackendErrorCode.Invalid.Auction.BidTooLow:
      return "현재 입찰 포인트보다 높게 입찰해야 합니다";
    case BackendErrorCode.Invalid.Auction.BidDuplicate:
      return "현재 입찰 중인 팀장은 재입찰할 수 없습니다";
    case BackendErrorCode.Invalid.Auction.BidTooHigh:
      return "최대 입찰 가능 금액을 초과했습니다";
    case BackendErrorCode.Invalid.PresetMemberPosition.Duplicated:
      return "이미 존재하는 프리셋 멤버 포지션입니다";

    case BackendErrorCode.Forbidden.Subscription.InsufficientPlan:
      return "현재 구독 플랜에서 사용할 수 없는 기능입니다";
    case BackendErrorCode.Forbidden.Subscription.InsufficientQuota:
      return "현재 구독 플랜의 한도를 초과했습니다";

    case BackendErrorCode.Forbidden.Auction.BidNotLeader:
      return "팀장이 아니면 입찰할 수 없습니다";
    case BackendErrorCode.Forbidden.Member.InsufficientRole:
      return "역할의 권한이 부족합니다";
    case BackendErrorCode.Forbidden.Member.ForbiddenRole:
      return "소유자 역할은 수정할 수 없습니다";
    case BackendErrorCode.Forbidden.Member.NotMember:
      return "서버의 멤버가 아닙니다";

    case BackendErrorCode.NotFound.Auction:
      return "경매가 만료되었거나 존재하지 않습니다";
    case BackendErrorCode.NotFound.Guild:
      return "서버를 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Member:
      return "멤버를 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Position:
      return "포지션을 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Preset:
      return "프리셋을 찾을 수 없습니다";
    case BackendErrorCode.NotFound.PresetMember:
      return "프리셋 멤버를 찾을 수 없습니다";
    case BackendErrorCode.NotFound.PresetMemberPosition:
      return "프리셋 멤버 포지션을 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Tier:
      return "티어를 찾을 수 없습니다";
    case BackendErrorCode.NotFound.User:
      return "사용자를 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Billing:
      return "결제 수단을 찾을 수 없습니다";
    case BackendErrorCode.NotFound.Subscription:
      return "구독을 찾을 수 없습니다";

    case BackendErrorCode.Unexpected.Internal:
      return "서버 내부에서 예기치 못한 문제가 발생했습니다";
    case BackendErrorCode.Unexpected.External:
      return "서버 외부에서 예기치 못한 문제가 발생했습니다";

    case FrontendErrorCode.Validation.Invalid:
      return "유효하지 않은 입력입니다";

    case FrontendErrorCode.Connection.Kicked:
      return "다른 기기 또는 탭에서 접속하여 연결이 끊겼습니다";

    case FrontendErrorCode.Unexpected.Internal:
      return "클라이언트 내부에서 예기치 못한 문제가 발생했습니다";
    case FrontendErrorCode.Unexpected.External:
      return "클라이언트 외부에서 예기치 못한 문제가 발생했습니다";

    case FrontendErrorCode.Toss.BillingAuth.InvalidCardNumber:
      return "카드번호를 다시 확인해주세요";
    case FrontendErrorCode.Toss.BillingAuth.InvalidCardExpiration:
      return "카드 유효기간을 다시 확인해주세요";
    case FrontendErrorCode.Toss.BillingAuth.InvalidCardPassword:
      return "카드 비밀번호를 다시 확인해주세요";
    case FrontendErrorCode.Toss.BillingAuth.InvalidCardIdentity:
      return "카드 소유주 정보가 일치하지 않습니다";
    case FrontendErrorCode.Toss.BillingAuth.InvalidStoppedCard:
      return "정지된 카드입니다";
    case FrontendErrorCode.Toss.BillingAuth.InvalidRejectCard:
      return "카드 사용이 거절되었습니다. 카드사에 문의해주세요";
    case FrontendErrorCode.Toss.BillingAuth.NotSupportedCardType:
      return "지원되지 않는 카드 종류입니다";
    case FrontendErrorCode.Toss.BillingAuth.ExceedMaxAuthCount:
      return "최대 인증 횟수를 초과했습니다. 카드사에 문의해주세요";
    case FrontendErrorCode.Toss.BillingAuth.RejectCardCompany:
      return "결제 승인이 거절되었습니다";
    case FrontendErrorCode.Toss.BillingAuth.InvalidBirthDayFormat:
      return "생년월일 또는 사업자번호 형식을 다시 확인해주세요";
    case FrontendErrorCode.Toss.BillingAuth.NotRegisteredCardCompany:
      return "카드를 사용 등록 후 이용해주세요";
    case FrontendErrorCode.Toss.BillingAuth.CommonError:
      return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요";

    default:
      return "알 수 없는 오류가 발생했습니다";
  }
}

export function parseTossErrorCode(tossCode: string): number {
  switch (tossCode) {
    case "INVALID_CARD_NUMBER":
      return FrontendErrorCode.Toss.BillingAuth.InvalidCardNumber;
    case "INVALID_CARD_EXPIRATION":
      return FrontendErrorCode.Toss.BillingAuth.InvalidCardExpiration;
    case "INVALID_CARD_PASSWORD":
      return FrontendErrorCode.Toss.BillingAuth.InvalidCardPassword;
    case "INVALID_CARD_IDENTITY":
      return FrontendErrorCode.Toss.BillingAuth.InvalidCardIdentity;
    case "INVALID_STOPPED_CARD":
      return FrontendErrorCode.Toss.BillingAuth.InvalidStoppedCard;
    case "INVALID_REJECT_CARD":
      return FrontendErrorCode.Toss.BillingAuth.InvalidRejectCard;
    case "NOT_SUPPORTED_CARD_TYPE":
      return FrontendErrorCode.Toss.BillingAuth.NotSupportedCardType;
    case "EXCEED_MAX_AUTH_COUNT":
      return FrontendErrorCode.Toss.BillingAuth.ExceedMaxAuthCount;
    case "REJECT_CARD_COMPANY":
      return FrontendErrorCode.Toss.BillingAuth.RejectCardCompany;
    case "INVALID_BIRTH_DAY_FORMAT":
      return FrontendErrorCode.Toss.BillingAuth.InvalidBirthDayFormat;
    case "NOT_REGISTERED_CARD_COMPANY":
      return FrontendErrorCode.Toss.BillingAuth.NotRegisteredCardCompany;
    case "COMMON_ERROR":
      return FrontendErrorCode.Toss.BillingAuth.CommonError;
    default:
      return FrontendErrorCode.Unexpected.External;
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
