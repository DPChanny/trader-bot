from __future__ import annotations

import argparse

from backend.utils.token import AccessToken, RefreshToken


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Print cookie-injection commands for test login"
    )
    parser.add_argument("discord_user_id", type=int)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    user_id = args.discord_user_id
    access_token, _ = AccessToken.create(user_id)
    refresh_token, _ = RefreshToken.create(user_id)

    access_cmd = (
        'document.cookie = "accessToken=' + access_token + '; path=/; SameSite=Lax";'
    )
    refresh_cmd = (
        'document.cookie = "refreshToken=' + refresh_token + '; path=/; SameSite=Lax";'
    )

    print(access_cmd)
    print(refresh_cmd)
    print("location.reload();")


if __name__ == "__main__":
    main()
