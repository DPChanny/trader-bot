import discord
from discord import app_commands
from discord.ext import commands

from shared.utils.db import get_session

from ..services.command_service import set_invite_channel_service


def include_command_router(bot: commands.Bot) -> None:
    @bot.tree.command(
        name="set_invite_channel", description="경매 초대 채널을 설정합니다."
    )
    @app_commands.default_permissions(administrator=True)
    @app_commands.guild_only()
    async def set_invite_channel_command(
        interaction: discord.Interaction, channel: discord.TextChannel | None = None
    ) -> None:
        channel_id = channel.id if channel else None
        async for session in get_session():
            await set_invite_channel_service(interaction.guild_id, channel_id, session)
        if channel:
            await interaction.response.send_message(
                f"경매 초대 채널이 {channel.mention}으로 설정되었습니다.",
                ephemeral=True,
            )
        else:
            await interaction.response.send_message(
                "경매 초대 채널이 해제되었습니다.", ephemeral=True
            )
