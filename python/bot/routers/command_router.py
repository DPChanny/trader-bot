import discord
from discord import app_commands
from discord.ext import commands

from shared.dtos.subscription import Plan
from shared.utils.db import get_session
from shared.utils.error import AppError
from shared.utils.verify import verify_plan

from ..services.command_service import set_invite_channel_service


def include_command_router(bot: commands.Bot) -> None:
    @bot.tree.command(
        name="set_invite_channel", description="경매 초대 채널을 설정합니다."
    )
    @app_commands.default_permissions(administrator=True)
    @app_commands.guild_only()
    async def set_invite_channel_command(
        interaction: discord.Interaction, channel: discord.TextChannel
    ) -> None:
        async for session in get_session():
            try:
                await verify_plan(interaction.guild_id, Plan.PLUS, session)
            except AppError:
                await interaction.response.send_message(
                    "이 명령어는 Trader Bot Plus 이상 플랜에서 사용할 수 있습니다.",
                    ephemeral=True,
                )
                return
            await set_invite_channel_service(interaction.guild_id, channel.id, session)
        await interaction.response.send_message(
            f"경매 초대 채널이 {channel.mention}으로 설정되었습니다.", ephemeral=True
        )

    @bot.tree.command(
        name="unset_invite_channel", description="경매 초대 채널을 해제합니다."
    )
    @app_commands.default_permissions(administrator=True)
    @app_commands.guild_only()
    async def unset_invite_channel_command(interaction: discord.Interaction) -> None:
        async for session in get_session():
            try:
                await verify_plan(interaction.guild_id, Plan.PLUS, session)
            except AppError:
                await interaction.response.send_message(
                    "이 명령어는 Trader Bot Plus 이상 플랜에서 사용할 수 있습니다.",
                    ephemeral=True,
                )
                return
            await set_invite_channel_service(interaction.guild_id, None, session)
        await interaction.response.send_message(
            "경매 초대 채널이 해제되었습니다.", ephemeral=True
        )
