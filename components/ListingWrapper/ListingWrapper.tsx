import type { DirectListing, EnglishAuction } from "thirdweb/extensions/marketplace";
import Link from "next/link";
import React from "react";
import { NFT_COLLECTION_ADDRESS } from "../../const/contractAddresses";
import styles from "../../styles/Buy.module.css";
import NFTComponent from "../NFT/NFT";

type Props = {
  listing: DirectListing | EnglishAuction;
};

/**
 * Accepts a listing and renders the associated NFT for it
 */
export default function ListingWrapper({ listing }: Props) {
  const nft = listing.asset;

  if (!nft) return null;

  return (
    <Link
      href={`/token/${NFT_COLLECTION_ADDRESS}/${nft.id.toString()}`}
      key={nft.id.toString()}
      className={styles.nftContainer}
    >
      <NFTComponent nft={nft} />
    </Link>
  );
}
