import uuid

from dtos.auction_dto import Team

from .auction import Auction


class Token:
    def __init__(
        self, auction_id: str, user_id: int, token: str, is_leader: bool
    ):
        self.auction_id = auction_id
        self.user_id = user_id
        self.token = token
        self.is_leader = is_leader


class AuctionManager:
    def __init__(self):
        self.auctions: dict[str, Auction] = {}
        self.token_to_auction: dict[str, str] = {}
        self.tokens: dict[str, Token] = {}
        self.auction_tokens: dict[str, list[str]] = {}
        self.next_auction_id: int = 1

    def add_auction(
        self,
        preset_id: int,
        teams: list[Team],
        user_ids: list[int],
        leader_user_ids: set[int],
        time: int,
    ) -> tuple[str, dict[int, str]]:
        auction_id = str(self.next_auction_id)
        self.next_auction_id += 1
        user_tokens = {}
        auction_token_list = []

        for user_id in user_ids:
            token = str(uuid.uuid4())
            user_tokens[user_id] = token

            token_info = Token(
                auction_id=auction_id,
                user_id=user_id,
                token=token,
                is_leader=user_id in leader_user_ids,
            )
            self.tokens[token] = token_info
            self.token_to_auction[token] = auction_id
            auction_token_list.append(token)

        auction = Auction(
            auction_id,
            preset_id,
            teams,
            user_ids,
            user_tokens,
            time,
        )
        self.auctions[auction_id] = auction
        self.auction_tokens[auction_id] = auction_token_list

        return auction_id, user_tokens

    def get_auction(self, auction_id: str) -> Auction | None:
        return self.auctions.get(auction_id)

    def get_auction_by_token(self, token: str) -> Auction | None:
        auction_id = self.token_to_auction.get(token)
        if auction_id:
            return self.auctions.get(auction_id)
        return None

    def get_token(self, token: str) -> Token | None:
        return self.tokens.get(token)

    def get_tokens(self, auction_id: str) -> list[Token]:
        token_list = self.auction_tokens.get(auction_id, [])
        return [
            self.tokens[token] for token in token_list if token in self.tokens
        ]

    def get_user_token(self, auction_id: str, user_id: int) -> Token | None:
        token_list = self.auction_tokens.get(auction_id, [])
        for token in token_list:
            token_info = self.tokens.get(token)
            if token_info and token_info.user_id == user_id:
                return token_info
        return None

    def remove_auction(self, auction_id: str):
        if auction_id in self.auctions:
            token_list = self.auction_tokens.get(auction_id, [])
            for token in token_list:
                if token in self.tokens:
                    del self.tokens[token]
                if token in self.token_to_auction:
                    del self.token_to_auction[token]

            if auction_id in self.auction_tokens:
                del self.auction_tokens[auction_id]

            del self.auctions[auction_id]


auction_manager = AuctionManager()
