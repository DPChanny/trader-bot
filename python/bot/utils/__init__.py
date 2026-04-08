from discord import Intents


def setup_intents() -> Intents:
    intents = Intents.default()
    intents.message_content = True
    intents.members = True
    return intents
