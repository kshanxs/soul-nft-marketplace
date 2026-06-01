import { getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { getNFTs } from "thirdweb/extensions/erc721";
import React from "react";
import Container from "../components/Container/Container";
import NFTGrid from "../components/NFT/NFTGrid";
import { NFT_COLLECTION_ADDRESS, NETWORK } from "../const/contractAddresses";
import { client } from "../util/client";

export default function Buy() {
  const contract = getContract({
    client,
    chain: NETWORK,
    address: NFT_COLLECTION_ADDRESS,
  });

  const { data, isLoading } = useReadContract(getNFTs, {
    contract,
    start: 0,
    count: 100,
  });

  return (
    <Container maxWidth="lg">
      <h1>Buy NFTs</h1>
      <p>Browse which NFTs are available from the collection.</p>
      <NFTGrid
        data={data}
        isLoading={isLoading}
        emptyText={
          "Looks like there are no NFTs in this collection. Did you import your contract on the thirdweb dashboard? https://thirdweb.com/dashboard"
        }
      />
    </Container>
  );
}
