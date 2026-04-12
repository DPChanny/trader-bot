from __future__ import annotations

import sys

from api.utils.token import AccessToken, RefreshToken
from test.dummy_entity import USERS


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: uv run python -m test.dummy_token <discord_user_id>")
        print("Example test IDs from dummy_entity:")
        for user in USERS:
            print(user["discord_id"])
        raise SystemExit(1)

    try:
        user_id = int(sys.argv[1])
    except ValueError:
        print(f"Invalid user id: {sys.argv[1]}")
        raise SystemExit(1) from None

    access_token, _ = AccessToken.create(user_id)
    refresh_token, _ = RefreshToken.create(user_id)

    print('document.cookie = "accessToken=' + access_token + '; path=/; SameSite=Lax";')
    print(
        'document.cookie = "refreshToken=' + refresh_token + '; path=/; SameSite=Lax";'
    )
    print("location.reload();")


if __name__ == "__main__":
    main()
