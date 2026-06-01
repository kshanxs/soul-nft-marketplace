import type { NFT } from "thirdweb";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import styles from "../../styles/Sale.module.css";
import profileStyles from "../../styles/Profile.module.css";
import {
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  MARKETPLACE_ADDRESS,
  NFT_COLLECTION_ADDRESS,
  NETWORK,
} from "../../const/contractAddresses";
import { getContract, sendAndConfirmTransaction } from "thirdweb";
import { isApprovedForAll, setApprovalForAll } from "thirdweb/extensions/erc721";
import { createListing, createAuction } from "thirdweb/extensions/marketplace";
import { client } from "../../util/client";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import toastStyle from "../../util/toastConfig";

type Props = {
  nft: NFT;
};

type AuctionFormData = {
  nftContractAddress: string;
  tokenId: string;
  startDate: Date;
  endDate: Date;
  floorPrice: string;
  buyoutPrice: string;
};

type DirectFormData = {
  nftContractAddress: string;
  tokenId: string;
  price: string;
  startDate: Date;
  endDate: Date;
};

export default function SaleInfo({ nft }: Props) {
  const router = useRouter();
  const address = useActiveAccount();

  // Connect to marketplace contract
  const marketplace = getContract({
    client,
    chain: NETWORK,
    address: MARKETPLACE_ADDRESS,
  });

  // Connect to NFT collection contract
  const nftCollection = getContract({
    client,
    chain: NETWORK,
    address: NFT_COLLECTION_ADDRESS,
  });

  // Manage form submission state using tabs and conditional rendering
  const [tab, setTab] = useState<"direct" | "auction">("direct");

  // Manage form values using react-hook-form library: Auction form
  const { register: registerAuction, handleSubmit: handleSubmitAuction } =
    useForm<AuctionFormData>({
      defaultValues: {
        nftContractAddress: NFT_COLLECTION_ADDRESS,
        tokenId: nft.id.toString(),
        startDate: new Date(),
        endDate: new Date(),
        floorPrice: "0",
        buyoutPrice: "0",
      },
    });

  // User requires to set marketplace approval before listing
  async function checkAndProvideApproval() {
    if (!address) {
      throw new Error("No wallet connected");
    }

    // Check if approval is required
    const hasApproval = await isApprovedForAll({
      contract: nftCollection,
      owner: address.address,
      operator: MARKETPLACE_ADDRESS,
    });

    // If it is, provide approval
    if (!hasApproval) {
      const tx = setApprovalForAll({
        contract: nftCollection,
        operator: MARKETPLACE_ADDRESS,
        approved: true,
      });

      const txResult = await sendAndConfirmTransaction({
        transaction: tx,
        account: address,
      });

      if (txResult) {
        toast.success("Marketplace approval granted", {
          icon: "👍",
          style: toastStyle,
          position: "bottom-center",
        });
      }
    }

    return true;
  }

  // Manage form values using react-hook-form library: Direct form
  const { register: registerDirect, handleSubmit: handleSubmitDirect } =
    useForm<DirectFormData>({
      defaultValues: {
        nftContractAddress: NFT_COLLECTION_ADDRESS,
        tokenId: nft.id.toString(),
        startDate: new Date(),
        endDate: new Date(),
        price: "0",
      },
    });

  async function handleSubmissionAuction(data: AuctionFormData) {
    await checkAndProvideApproval();
    return createAuction({
      contract: marketplace,
      assetContractAddress: data.nftContractAddress,
      tokenId: BigInt(data.tokenId),
      buyoutBidAmount: data.buyoutPrice,
      minimumBidAmount: data.floorPrice,
      startTimestamp: new Date(data.startDate),
      endTimestamp: new Date(data.endDate),
    });
  }

  async function handleSubmissionDirect(data: DirectFormData) {
    await checkAndProvideApproval();
    return createListing({
      contract: marketplace,
      assetContractAddress: data.nftContractAddress,
      tokenId: BigInt(data.tokenId),
      pricePerToken: data.price,
      startTimestamp: new Date(data.startDate),
      endTimestamp: new Date(data.endDate),
    });
  }

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <div className={styles.saleInfoContainer} style={{ marginTop: -42 }}>
        <div className={profileStyles.tabs}>
          <h3
            className={`${profileStyles.tab} 
        ${tab === "direct" ? profileStyles.activeTab : ""}`}
            onClick={() => setTab("direct")}
          >
            Direct
          </h3>
          <h3
            className={`${profileStyles.tab} 
        ${tab === "auction" ? profileStyles.activeTab : ""}`}
            onClick={() => setTab("auction")}
          >
            Auction
          </h3>
        </div>

        {/* Direct listing fields */}
        <div
          className={`${
            tab === "direct"
              ? styles.activeTabContent
              : profileStyles.tabContent
          }`}
          style={{ flexDirection: "column" }}
        >
          <h4 className={styles.formSectionTitle}>When </h4>

          {/* Input field for auction start date */}
          <legend className={styles.legend}> Listing Starts on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerDirect("startDate")}
            aria-label="Auction Start Date"
          />

          {/* Input field for auction end date */}
          <legend className={styles.legend}> Listing Ends on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerDirect("endDate")}
            aria-label="Auction End Date"
          />
          <h4 className={styles.formSectionTitle}>Price </h4>

          {/* Input field for buyout price */}
          <legend className={styles.legend}> Price per token</legend>
          <input
            className={styles.input}
            type="number"
            step={0.000001}
            {...registerDirect("price")}
          />

          <TransactionButton
            transaction={async () => {
              return new Promise((resolve, reject) => {
                handleSubmitDirect(async (data) => {
                  try {
                    const tx = await handleSubmissionDirect(data);
                    resolve(tx);
                  } catch (err) {
                    reject(err);
                  }
                })();
              });
            }}
            onError={(error) => {
              toast(`Listed Failed! Reason: ${error.message || error}`, {
                icon: "❌",
                style: toastStyle,
                position: "bottom-center",
              });
            }}
            onTransactionConfirmed={(txResult) => {
              toast("Listed Successfully!", {
                icon: "🥳",
                style: toastStyle,
                position: "bottom-center",
              });
              router.push(
                `/token/${NFT_COLLECTION_ADDRESS}/${nft.id.toString()}`
              );
            }}
          >
            Create Direct Listing
          </TransactionButton>
        </div>

        {/* Auction listing fields */}
        <div
          className={`${
            tab === "auction"
              ? styles.activeTabContent
              : profileStyles.tabContent
          }`}
          style={{ flexDirection: "column" }}
        >
          <h4 className={styles.formSectionTitle}>When </h4>

          {/* Input field for auction start date */}
          <legend className={styles.legend}> Auction Starts on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerAuction("startDate")}
            aria-label="Auction Start Date"
          />

          {/* Input field for auction end date */}
          <legend className={styles.legend}> Auction Ends on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerAuction("endDate")}
            aria-label="Auction End Date"
          />
          <h4 className={styles.formSectionTitle}>Price </h4>

          {/* Input field for minimum bid price */}
          <legend className={styles.legend}> Allow bids starting from </legend>
          <input
            className={styles.input}
            step={0.000001}
            type="number"
            {...registerAuction("floorPrice")}
          />

          {/* Input field for buyout price */}
          <legend className={styles.legend}> Buyout price </legend>
          <input
            className={styles.input}
            type="number"
            step={0.000001}
            {...registerAuction("buyoutPrice")}
          />

          <TransactionButton
            transaction={async () => {
              return new Promise((resolve, reject) => {
                handleSubmitAuction(async (data) => {
                  try {
                    const tx = await handleSubmissionAuction(data);
                    resolve(tx);
                  } catch (err) {
                    reject(err);
                  }
                })();
              });
            }}
            onError={(error) => {
              toast(`Listed Failed! Reason: ${error.message || error}`, {
                icon: "❌",
                style: toastStyle,
                position: "bottom-center",
              });
            }}
            onTransactionConfirmed={(txResult) => {
              toast("Listed Successfully!", {
                icon: "🥳",
                style: toastStyle,
                position: "bottom-center",
              });
              router.push(
                `/token/${NFT_COLLECTION_ADDRESS}/${nft.id.toString()}`
              );
            }}
          >
            Create Auction Listing
          </TransactionButton>
        </div>
      </div>
    </>
  );
}
