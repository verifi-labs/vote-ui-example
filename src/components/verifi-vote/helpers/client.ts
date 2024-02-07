import { Chain, Client, PublicClient, createPublicClient, http } from 'viem'
import { arbitrum, goerli, mainnet, polygon, sepolia } from 'viem/chains'

const clients: Record<number, PublicClient | undefined> = {};

const CHAINS: Record<number, Chain> = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  5: goerli,
  11155111: sepolia,
}

export function getClient(networkId: number): PublicClient {
  const url = `https://rpc.snapshotx.xyz/${networkId}`;

  let client = clients[networkId];
  if(client) return client;
  
  client = createPublicClient({
    chain: CHAINS[networkId],
    transport: http(url),
    cacheTime: 25000,
  })
  
  clients[networkId] = client;  

  return client
  
}
