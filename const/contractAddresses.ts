/** Replace the values below with the addresses of your smart contracts. */

// 1. Set up the network your smart contracts are deployed to.
// First, import the chain from the package, then set the NETWORK variable to the chain.
import { defineChain } from "thirdweb";
export const NETWORK = defineChain(80001); // Polygon Mumbai Testnet (deprecated, consider Amoy 80002)

// 2. The address of the marketplace V3 smart contract.
// Deploy your own: https://thirdweb.com/thirdweb.eth/MarketplaceV3
export const MARKETPLACE_ADDRESS = "0xbA89C485B3E4a806DFfcC1fbc35a676d4F9B4D13";

// 3. The address of your NFT collection smart contract.
export const NFT_COLLECTION_ADDRESS = "0x40FA7358d3147355cdA4a5eEAfb3fc3c157a634E";

// (Optional) Set up the URL of where users can view transactions on
// For example, below, we use Mumbai.polygonscan to view transactions on the Mumbai testnet.
export const ETHERSCAN_URL = "https://mumbai.polygonscan.com";
