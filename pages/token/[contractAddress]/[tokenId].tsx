import {
  MediaRenderer,
  useContractEvents,
  useReadContract,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import React, { useState } from "react";
import Container from "../../../components/Container/Container";
import { GetStaticProps, GetStaticPaths } from "next";
import type { NFT } from "thirdweb";
import { getContract, createThirdwebClient } from "thirdweb";
import { getNFT, transferEvent } from "thirdweb/extensions/erc721";
import { getContractMetadata } from "thirdweb/extensions/common";
import {
  getAllValidListings,
  getAllValidAuctions,
  buyFromListing,
  buyoutAuction,
  bidInAuction,
  makeOffer,
} from "thirdweb/extensions/marketplace";
import { client } from "../../../util/client";
import {
  ETHERSCAN_URL,
  MARKETPLACE_ADDRESS,
  NETWORK,
  NFT_COLLECTION_ADDRESS,
} from "../../../const/contractAddresses";
import styles from "../../../styles/Token.module.css";
import Link from "next/link";
import randomColor from "../../../util/randomColor";
import Skeleton from "../../../components/Skeleton/Skeleton";
import toast, { Toaster } from "react-hot-toast";
import toastStyle from "../../../util/toastConfig";

type Props = {
  nft: NFT & { id: string }; // id is stringified for Next.js JSON serialization in getStaticProps
  contractMetadata: any;
};

const [randomColor1, randomColor2] = [randomColor(), randomColor()];

export default function TokenPage({ nft, contractMetadata }: Props) {
  const [bidValue, setBidValue] = useState<string>();
  const account = useActiveAccount();

  // Connect to marketplace smart contract
  const marketplace = getContract({
    client,
    chain: NETWORK,
    address: MARKETPLACE_ADDRESS,
  });

  // Connect to NFT Collection smart contract
  const nftCollection = getContract({
    client,
    chain: NETWORK,
    address: NFT_COLLECTION_ADDRESS,
  });

  // 1. Load if the NFT is for direct listing
  const { data: allDirectListings, isLoading: loadingDirect } = useReadContract(
    getAllValidListings,
    {
      contract: marketplace,
    }
  );

  const directListing = allDirectListings?.filter(
    (l) =>
      l.assetContractAddress.toLowerCase() === NFT_COLLECTION_ADDRESS.toLowerCase() &&
      l.tokenId === BigInt(nft.id)
  );

  // 2. Load if the NFT is for auction
  const { data: allAuctionListings, isLoading: loadingAuction } = useReadContract(
    getAllValidAuctions,
    {
      contract: marketplace,
    }
  );

  const auctionListing = allAuctionListings?.filter(
    (l) =>
      l.assetContractAddress.toLowerCase() === NFT_COLLECTION_ADDRESS.toLowerCase() &&
      l.tokenId === BigInt(nft.id)
  );

  // Load historical transfer events
  const { data: transferEvents, isLoading: loadingTransferEvents } = useContractEvents({
    contract: nftCollection,
    events: [
      transferEvent({
        tokenId: BigInt(nft.id),
      }),
    ],
  });

  const loadingContract = false;

  async function createBidOrOffer() {
    if (!bidValue) {
      toast(`Please enter a bid value`, {
        icon: "❌",
        style: toastStyle,
        position: "bottom-center",
      });
      throw new Error("Please enter a bid value");
    }

    if (auctionListing?.[0]) {
      return bidInAuction({
        contract: marketplace,
        auctionId: auctionListing[0].id,
        bidAmount: bidValue,
      });
    } else if (directListing?.[0]) {
      return makeOffer({
        contract: marketplace,
        assetContractAddress: NFT_COLLECTION_ADDRESS,
        tokenId: BigInt(nft.id),
        currencyContractAddress: directListing[0].currencyContractAddress,
        totalOffer: bidValue,
        offerExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      });
    } else {
      throw new Error("No valid listing found for this NFT");
    }
  }

  async function buyListing() {
    if (auctionListing?.[0]) {
      return buyoutAuction({
        contract: marketplace,
        auctionId: auctionListing[0].id,
      });
    } else if (directListing?.[0]) {
      return buyFromListing({
        contract: marketplace,
        listingId: directListing[0].id,
        quantity: BigInt(1),
        recipient: account?.address || "",
      });
    } else {
      throw new Error("No valid listing found for this NFT");
    }
  }

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <Container maxWidth="lg">
        <div className={styles.container}>
          <div className={styles.metadataContainer}>
            <MediaRenderer
              client={client}
              src={nft.metadata.image}
              className={styles.image}
            />

            <div className={styles.descriptionContainer}>
              <h3 className={styles.descriptionTitle}>Description</h3>
              <p className={styles.description}>{nft.metadata.description}</p>

              <h3 className={styles.descriptionTitle}>Traits</h3>

              <div className={styles.traitsContainer}>
                {Object.entries(nft?.metadata?.attributes || {}).map(
                  ([key, value]) => (
                    <div className={styles.traitContainer} key={key}>
                      <p className={styles.traitName}>{key}</p>
                      <p className={styles.traitValue}>
                        {value?.toString() || ""}
                      </p>
                    </div>
                  )
                )}
              </div>

              <h3 className={styles.descriptionTitle}>History</h3>

              <div className={styles.traitsContainer}>
                {loadingTransferEvents ? (
                  <Skeleton width="100%" height="40" />
                ) : (
                  transferEvents?.map((event, index) => (
                    <div
                      key={event.transactionHash}
                      className={styles.eventsContainer}
                    >
                      <div className={styles.eventContainer}>
                        <p className={styles.traitName}>Event</p>
                        <p className={styles.traitValue}>
                          {
                            // if last event in array, then it's a mint
                            index === transferEvents.length - 1
                              ? "Mint"
                              : "Transfer"
                          }
                        </p>
                      </div>

                      <div className={styles.eventContainer}>
                        <p className={styles.traitName}>From</p>
                        <p className={styles.traitValue}>
                          {event.args.from?.slice(0, 4)}...
                          {event.args.from?.slice(-2)}
                        </p>
                      </div>

                      <div className={styles.eventContainer}>
                        <p className={styles.traitName}>To</p>
                        <p className={styles.traitValue}>
                          {event.args.to?.slice(0, 4)}...
                          {event.args.to?.slice(-2)}
                        </p>
                      </div>

                      <div className={styles.eventContainer}>
                        <Link
                          className={styles.txHashArrow}
                          href={`${ETHERSCAN_URL}/tx/${event.transactionHash}`}
                          target="_blank"
                        >
                          ↗
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.listingContainer}>
            {contractMetadata && (
              <div className={styles.contractMetadataContainer}>
                <MediaRenderer
                  client={client}
                  src={contractMetadata.image}
                  className={styles.collectionImage}
                />
                <p className={styles.collectionName}>{contractMetadata.name}</p>
              </div>
            )}
            <h1 className={styles.title}>{nft.metadata.name}</h1>
            <p className={styles.collectionName}>Token ID #{nft.id}</p>

            <Link
              href={`/profile/${nft.owner || ""}`}
              className={styles.nftOwnerContainer}
            >
              {/* Random linear gradient circle shape */}
              <div
                className={styles.nftOwnerImage}
                style={{
                  background: `linear-gradient(90deg, ${randomColor1}, ${randomColor2})`,
                }}
              />
              <div className={styles.nftOwnerInfo}>
                <p className={styles.label}>Current Owner</p>
                <p className={styles.nftOwnerAddress}>
                  {nft.owner ? `${nft.owner.slice(0, 8)}...${nft.owner.slice(-4)}` : "Unknown"}
                </p>
              </div>
            </Link>

            <div className={styles.pricingContainer}>
              {/* Pricing information */}
              <div className={styles.pricingInfo}>
                <p className={styles.label}>Price</p>
                <div className={styles.pricingValue}>
                  {loadingContract || loadingDirect || loadingAuction ? (
                    <Skeleton width="120" height="24" />
                  ) : (
                    <>
                      {directListing && directListing[0] ? (
                        <>
                          {directListing[0]?.currencyValuePerToken.displayValue}
                          {" " + directListing[0]?.currencyValuePerToken.symbol}
                        </>
                      ) : auctionListing && auctionListing[0] ? (
                        <>
                          {auctionListing[0]?.buyoutCurrencyValue.displayValue}
                          {" " + auctionListing[0]?.buyoutCurrencyValue.symbol}
                        </>
                      ) : (
                        "Not for sale"
                      )}
                    </>
                  )}
                </div>

                <div>
                  {loadingAuction ? (
                    <Skeleton width="120" height="24" />
                  ) : (
                    <>
                      {auctionListing && auctionListing[0] && (
                        <>
                          <p className={styles.label} style={{ marginTop: 12 }}>
                            Bids starting from
                          </p>

                          <div className={styles.pricingValue}>
                            {
                              auctionListing[0]?.minimumBidCurrencyValue
                                .displayValue
                            }
                            {" " +
                              auctionListing[0]?.minimumBidCurrencyValue.symbol}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {loadingContract || loadingDirect || loadingAuction ? (
              <Skeleton width="100%" height="164" />
            ) : (
              <>
                <TransactionButton
                  transaction={async () => await buyListing()}
                  className={styles.btn}
                  onTransactionConfirmed={() => {
                    toast(`Purchase success!`, {
                      icon: "✅",
                      style: toastStyle,
                      position: "bottom-center",
                    });
                  }}
                  onError={(e) => {
                    toast(`Purchase failed! Reason: ${e.message}`, {
                      icon: "❌",
                      style: toastStyle,
                      position: "bottom-center",
                    });
                  }}
                >
                  Buy at asking price
                </TransactionButton>

                <div className={`${styles.listingTimeContainer} ${styles.or}`}>
                  <p className={styles.listingTime}>or</p>
                </div>

                <input
                  className={styles.input}
                  defaultValue={
                    auctionListing?.[0]?.minimumBidCurrencyValue
                      ?.displayValue || 0
                  }
                  type="number"
                  step={0.000001}
                  onChange={(e) => {
                    setBidValue(e.target.value);
                  }}
                />

                <TransactionButton
                  transaction={async () => await createBidOrOffer()}
                  className={styles.btn}
                  onTransactionConfirmed={() => {
                    toast(`Bid success!`, {
                      icon: "✅",
                      style: toastStyle,
                      position: "bottom-center",
                    });
                  }}
                  onError={(e) => {
                    console.log(e);
                    toast(`Bid failed! Reason: ${e.message}`, {
                      icon: "❌",
                      style: toastStyle,
                      position: "bottom-center",
                    });
                  }}
                >
                  Place bid
                </TransactionButton>
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const tokenId = context.params?.tokenId as string;

  try {
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
    });

    const contract = getContract({
      client,
      chain: NETWORK,
      address: NFT_COLLECTION_ADDRESS,
    });

    const nft = await getNFT({
      contract,
      tokenId: BigInt(tokenId),
    });

    // BigInt fields cannot be serialized as JSON by Next.js, so we convert them to strings
    const serializedNft = {
      ...nft,
      id: nft.id.toString(),
    };

    let contractMetadata = null;
    try {
      contractMetadata = await getContractMetadata({ contract });
    } catch (e) {}

    return {
      props: {
        nft: serializedNft,
        contractMetadata: contractMetadata || null,
      },
      revalidate: 1, // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration
    };
  } catch (error) {
    console.error("Failed to fetch NFT data in getStaticProps:", error);
    return {
      notFound: true,
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};
