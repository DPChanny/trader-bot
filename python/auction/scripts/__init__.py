from pathlib import Path


_dir = Path(__file__).parent

NEXT_PLAYER_SCRIPT = (_dir / "next_player.lua").read_text(encoding="utf-8")
PLACE_BID_SCRIPT = (_dir / "place_bid.lua").read_text(encoding="utf-8")
PUBLISH_STATUS_SCRIPT = (_dir / "publish_status.lua").read_text(encoding="utf-8")
PUBLISH_LEADER_SCRIPT = (_dir / "publish_leader.lua").read_text(encoding="utf-8")
PUBLISH_MEMBER_SOLD_SCRIPT = (_dir / "publish_member_sold.lua").read_text(
    encoding="utf-8"
)
PUBLISH_MEMBER_UNSOLD_SCRIPT = (_dir / "publish_member_unsold.lua").read_text(
    encoding="utf-8"
)
PUBLISH_TICK_SCRIPT = (_dir / "publish_tick.lua").read_text(encoding="utf-8")
