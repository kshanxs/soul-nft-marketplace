import { MediaRenderer, useReadContract } from "thirdweb/react";
import type { NFT } from "thirdweb";
import { getContract } from "thirdweb";
import React from "react";
import {
  MARKETPLACE_ADDRESS,
  NFT_COLLECTION_ADDRESS,
  NETWORK,
} from "../../const/contractAddresses";
import { client } from "../../util/client";
import { getAllValidListings, getAllValidAuctions } from "thirdweb/extensions/marketplace";
import Skeleton from "../Skeleton/Skeleton";
import styles from "./NFT.module.css";

type Props = {
  nft: NFT;
};

export default function NFTComponent({ nft }: Props) {
  const marketplace = getContract({
    client,
    chain: NETWORK,
    address: MARKETPLACE_ADDRESS,
  });

  // 1. Load if the NFT is for direct listing
  const { data: allDirectListings, isLoading: loadingDirect } = useReadContract(
    getAllValidListings,
    {
      contract: marketplace,
    }
  );

  const directListing = allDirectListings?.filter(
    (listing) =>
      listing.assetContractAddress.toLowerCase() ===
        NFT_COLLECTION_ADDRESS.toLowerCase() &&
      listing.tokenId === nft.id
  );

  // 2. Load if the NFT is for auction
  const { data: allAuctionListings, isLoading: loadingAuction } = useReadContract(
    getAllValidAuctions,
    {
      contract: marketplace,
    }
  );

  const auctionListing = allAuctionListings?.filter(
    (listing) =>
      listing.assetContractAddress.toLowerCase() ===
        NFT_COLLECTION_ADDRESS.toLowerCase() &&
      listing.tokenId === nft.id
  );

  const loadingContract = false;

  return (
    <>
      <MediaRenderer client={client} src={nft.metadata.image} className={styles.nftImage} />

      <p className={styles.nftTokenId}>Token ID #{nft.id.toString()}</p>
      <p className={styles.nftName}>{nft.metadata.name}</p>

      <div className={styles.priceContainer}>
        {loadingContract || loadingDirect || loadingAuction ? (
          <Skeleton width="100%" height="100%" />
        ) : directListing && directListing[0] ? (
          <div className={styles.nftPriceContainer}>
            <div>
              <p className={styles.nftPriceLabel}>Price</p>
              <p className={styles.nftPriceValue}>
                {`${directListing[0]?.currencyValuePerToken.displayValue}
          ${directListing[0]?.currencyValuePerToken.symbol}`}
              </p>
            </div>
          </div>
        ) : auctionListing && auctionListing[0] ? (
          <div className={styles.nftPriceContainer}>
            <div>
              <p className={styles.nftPriceLabel}>Minimum Bid</p>
              <p className={styles.nftPriceValue}>
                {`${auctionListing[0]?.minimumBidCurrencyValue.displayValue}
          ${auctionListing[0]?.minimumBidCurrencyValue.symbol}`}
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.nftPriceContainer}>
            <div>
              <p className={styles.nftPriceLabel}>Price</p>
              <p className={styles.nftPriceValue}>Not for sale</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
