import { createApi } from '../common/graphqlApi';
import { EVM_CONNECTORS } from '../common/constants';
import { createActions } from './actions';
import * as constants from './constants';
import { getClient } from '../../helpers/client';
import networks from '../../helpers/networks.json';
import { Network } from '../../networks/types';
import { NetworkID, Space } from '../../types';
import { useBlockNumber } from 'wagmi';
import { useEffect, useRef } from 'react';
import { Block } from 'viem';

type Metadata = {
  name: string;
  ticker?: string;
  chainId: number;
  currentChainId?: number;
  apiUrl: string;
  avatar: string;
  blockTime: number;
};

// shared for both ETH mainnet and ARB1
const ETH_MAINNET_BLOCK_TIME = 12.09;

export const METADATA: Record<string, Metadata> = {
  matic: {
    name: 'Polygon',
    ticker: 'MATIC',
    chainId: 137,
    apiUrl: 'https://api.studio.thegraph.com/query/23545/sx-polygon/version/latest',
    avatar: 'ipfs://bafkreihcx4zkpfjfcs6fazjp6lcyes4pdhqx3uvnjuo5uj2dlsjopxv5am',
    blockTime: 2.15812
  },
  arb1: {
    name: 'Arbitrum One',
    chainId: 42161,
    currentChainId: 1,
    apiUrl: 'https://api.studio.thegraph.com/query/23545/sx-arbitrum/version/latest',
    avatar: 'ipfs://bafkreic2p3zzafvz34y4tnx2kaoj6osqo66fpdo3xnagocil452y766gdq',
    blockTime: ETH_MAINNET_BLOCK_TIME
  },
  eth: {
    name: 'Ethereum',
    chainId: 1,
    apiUrl: 'https://api.studio.thegraph.com/query/23545/sx/version/latest',
    avatar: 'ipfs://bafkreid7ndxh6y2ljw2jhbisodiyrhcy2udvnwqgon5wgells3kh4si5z4',
    blockTime: ETH_MAINNET_BLOCK_TIME
  },
  gor: {
    name: 'Ethereum Goerli',
    chainId: 5,
    apiUrl: 'https://api.studio.thegraph.com/query/23545/sx-goerli/version/latest',
    avatar: 'ipfs://bafkreid7ndxh6y2ljw2jhbisodiyrhcy2udvnwqgon5wgells3kh4si5z4',
    blockTime: 15.52512
  },
  sep: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    apiUrl: 'https://api.studio.thegraph.com/query/23545/sx-sepolia/version/latest',
    avatar: 'ipfs://bafkreid7ndxh6y2ljw2jhbisodiyrhcy2udvnwqgon5wgells3kh4si5z4',
    blockTime: 13.2816
  },
  'linea-testnet': {
    name: 'Linea testnet',
    chainId: 59140,
    apiUrl: 'https://thegraph.goerli.zkevm.consensys.net/subgraphs/name/snapshot-labs/sx-subgraph',
    avatar: 'ipfs://bafkreibn4mjs54bnmvkrkiaiwp47gvcz6bervg2kr5ubknytfyz6l5wbs4',
    blockTime: 13.52926
  },
  'magma-tn': {
    name: 'Magma Onyx',
    chainId: 48715795616,
    apiUrl: 'https://thegraph.goerli.zkevm.consensys.net/subgraphs/name/snapshot-labs/sx-subgraph',
    //avatar: 'ipfs://bafkreif23tfblkwgrngegq333t36pkkrrt2oyew2c5qwyl4dwz6yqc6qxm',
    avatar: 'ipfs://bafkreicjpq566s2eblxpbc3kqfsldyzfzp5phkh6j4z6t4bhu4tfkcgecy',    
    blockTime: ETH_MAINNET_BLOCK_TIME
  }
};


export const getBlock = async (networkId: NetworkID) => {
  const { chainId } = METADATA[networkId];
  const client = await getClient(chainId);
  return await client.getBlock();  
}

export const useBlocks = () => {
  
  type Blocks = Record<keyof typeof METADATA, Block>;
  
  // Create a ref to maintain the master `blocks` object
  const blocksRef = useRef<Blocks>();
  // only works with the current wallet connection instead of the network of the space but we can optimize it later
  const blockNumber = useBlockNumber();
  const ethClient = getClient(1);
  const sepClient = getClient(11155111);
  
  useEffect(() => {   
    async function getBlocks() {  
      const ethBlock = await ethClient.getBlock();
      const sepBlock = await sepClient.getBlock();
      return {
        eth: ethBlock,
        sep: sepBlock,
      };
    }

    getBlocks().then(blocks => {
      blocksRef.current = blocks;
    })
  }, [blockNumber, ethClient, sepClient]);

  return blocksRef.current;
};



export function createEvmNetwork(networkId: NetworkID): Network {
  const { name, chainId, currentChainId, apiUrl, avatar } = METADATA[networkId];

  const provider = getClient(chainId);
  const api = createApi(apiUrl, networkId, {
    //highlightApiUrl: import.meta.env.VITE_HIGHLIGHT_URL
  });

  const helpers = {    
    waitForTransaction: (txId: `0x${string}`) => provider.waitForTransactionReceipt({ hash: txId }),
    waitForSpace: (spaceAddress: string, interval = 5000): Promise<Space> =>
      new Promise(resolve => {
        const timer = setInterval(async () => {
          const space = await api.loadSpace(spaceAddress);
          if (space) {
            clearInterval(timer);
            resolve(space);
          }
        }, interval);
      }),
    getExplorerUrl: (id: any, type: string) => {
      let dataType: 'tx' | 'address' | 'token' = 'tx';
      if (type === 'token') dataType = 'token';
      else if (['address', 'contract'].includes(type)) dataType = 'address';
      // @ts-ignore
      return `${networks[chainId].explorer}/${dataType}/${id}`;
    }
  };

  return {
    name,
    avatar,
    currentUnit: 'block',
    chainId,
    baseChainId: chainId,
    currentChainId: currentChainId ?? chainId,
    hasReceive: false,
    supportsSimulation: ['eth', 'gor', 'sep', 'matic', 'arb1'].includes(networkId),
    managerConnectors: EVM_CONNECTORS,
    actions: createActions(helpers, chainId),
    api,
    constants,
    helpers
  } as any;
}
