# Soul NFT Marketplace

Discover the art that speaks to your soul on **Soul**, NFT Marketplace. Built on top of your NFT collection using Next.js, React, TypeScript, and thirdweb Marketplace V3 contracts.

GitHub Repository: [kshanxs/soul-nft-marketplace](https://github.com/kshanxs/soul-nft-marketplace)

## Features

- View all NFTs from your collection and their status on the marketplace on the [buy](/pages/buy.tsx) page.

- Select which NFT from your wallet to sell for either a **direct listing** or **english auction** on the marketplace on the [sell](/pages/sell.tsx) page.

- View all NFTs a user owns from your collection on the [profile](/pages/profile/%5Baddress%5D.tsx) pages.

- Buy NFTs directly from the marketplace on the [item](/pages/token/%5BcontractAddress%5D/%5BtokenId%5D.tsx) pages.

- Place bids/offers on NFTs from the marketplace on the [item](/pages/token/%5BcontractAddress%5D/%5BtokenId%5D.tsx) pages.

<br/>

## Using this template

1. Deploy a [Marketplace V3](https://thirdweb.com/thirdweb.eth/MarketplaceV3) contract
2. Clone this repository using the [CLI](https://portal.thirdweb.com/cli)
3. Plug your contract addresses and chain in the [contractAddresses.ts](/const/contractAddresses.ts) file.

<br/>

### Deploy the Marketplace V3 contract

Head to the [MarketplaceV3](https://thirdweb.com/thirdweb.eth/MarketplaceV3) contract page on the thirdweb dashboard.

Deploy the marketplace to the same network as your NFT collection.

<br/>

### Clone this repository

Clone a copy of this repository:

```bash
git clone https://github.com/kshanxs/soul-nft-marketplace.git
cd soul-nft-marketplace
npm install
```

_Note: This requires [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and [Git](https://git-scm.com/downloads). [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) is also recommended._

<br/>

### Add your contract addresses

In the [contractAddresses.ts](/const/contractAddresses.ts) file, add your contract addresses and chain.

If you haven't already, import your smart contracts into the [thirdweb dashboard](https://thirdweb.com/dashboard).

```ts
/** Replace the values below with the addresses of your smart contracts */

// 1. Set up the network your smart contracts are deployed to.
// First, import the chain from the package, then set the NETWORK variable to the chain.
import { Mumbai } from "@thirdweb-dev/chains";
export const NETWORK = Mumbai;

// 2. The address of the marketplace V3 smart contract.
// Deploy your own: https://thirdweb.com/thirdweb.eth/MarketplaceV3
export const MARKETPLACE_ADDRESS = "";

// 3. The address of your NFT collection smart contract.
export const NFT_COLLECTION_ADDRESS = "";

// (Optional) Set up the URL of where users can view transactions on
// For example, below, we use Mumbai.polygonscan to view transactions on the Mumbai testnet.
export const ETHERSCAN_URL = "https://mumbai.polygonscan.com";
```

## thirdweb SDK v5 Migration Guide

This project has been updated from the legacy thirdweb SDK v3 to the latest **thirdweb SDK v5** (the unified `thirdweb` package). 

### Why We Migrated
1. **Functional and Modular API**: SDK v5 moves away from a monolithic, class-based SDK to a tree-shakable function-based design. This dramatically reduces the client-side bundle size since you only bundle the exact features you use.
2. **Enhanced Performance**: It uses optimized RPC handling and under-the-hood caching.
3. **Future-Proof Infrastructure**: Deprecated testnets (like Polygon Mumbai) have been phased out. The new architecture is compatible with all modern networks including **Polygon Amoy** and **Sepolia**.

---

### What Changed

* **Client Initialization**: Instead of passing custom providers with preset chain properties, we now initialize a unified `thirdwebClient` in [client.ts](file:///Users/shubh/Developer/marketplace-v3-master/util/client.ts) which handles RPC connectivity, storage gateways, and wallet connection state.
* **Wallet Connection**: We replaced `<ConnectWallet>` with the modern, customizable `<ConnectButton>` and swapped `useAddress()` for `useActiveAccount()?.address`.
* **Rendering NFT Media**: The legacy `<ThirdwebNftMedia>` component has been replaced with `<MediaRenderer>` which supports automatic format detection and fetches assets smoothly through the thirdweb IPFS gateway.
* **Functional Read Hooks**: Legacy hooks like `useNFTs`, `useOwnedNFTs`, `useValidDirectListings`, and `useValidEnglishAuctions` were replaced by the universal **`useReadContract`** hook combined with standard extensions (like `getNFTs`, `getOwnedNFTs`, `getAllValidListings`, and `getAllValidAuctions`).
* **Direct Asset Resolution**: In SDK v5, listings and auctions returned by the marketplace extensions already include the resolved `asset` NFT metadata. We simplified the `ListingWrapper` component to render the NFT directly from the listing, avoiding redundant RPC fetches.
* **Unified Write Transactions**: The old `<Web3Button>` has been upgraded to **`<TransactionButton>`**. Form data is compiled into "prepared transactions" using the marketplace extensions (`createListing`, `createAuction`, `buyFromListing`, `buyoutAuction`, `bidInAuction`, `makeOffer`) and signed in a single button execution flow.

---

### How the New SDK Works

1. **Client Setup**: Ensure you create a thirdweb Client ID on the thirdweb dashboard and set it in your environment:
   ```env
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
   ```
2. **Define Chain and Contracts**: In [contractAddresses.ts](file:///Users/shubh/Developer/marketplace-v3-master/const/contractAddresses.ts), chains are defined using `defineChain(chainId)`. Contracts are initialized on the client using:
   ```typescript
   import { getContract } from "thirdweb";
   
   const contract = getContract({
     client,
     chain: NETWORK,
     address: NFT_COLLECTION_ADDRESS,
   });
   ```
3. **Read Data**: Pass the contract and parameters to the extension function inside `useReadContract`:
   ```typescript
   const { data: nfts, isLoading } = useReadContract(getNFTs, {
     contract,
     start: 0,
     count: 10,
   });
   ```
4. **Write Transactions**: Return a prepared transaction from the `transaction` prop of the `<TransactionButton>`:
   ```tsx
   <TransactionButton
     transaction={() => buyFromListing({ contract, listingId, quantity: 1n, recipient })}
     onSuccess={() => console.log("Success!")}
   >
     Buy NFT
   </TransactionButton>
   ```

## Join our Discord!

For any questions, suggestions, join our discord at [https://discord.gg/thirdweb](https://discord.gg/thirdweb).
