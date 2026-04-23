import { createContext } from "react";

export type AuctionPageContextValue = {
  connectedMemberIds: number[];
  clientMemberId?: number;
};

export const AuctionPageContext = createContext<AuctionPageContextValue | null>(
  null,
);

export const AuctionPageContextProvider = AuctionPageContext.Provider;
