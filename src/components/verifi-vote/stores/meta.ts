import { useEffect, useRef } from 'react';
import { NetworkID, chainAsNetworkID } from '../types';
import { getClient } from '../helpers/client';
import { evmNetworks, getNetwork } from '../networks';
import { METADATA, useBlocks } from '../networks/evm';
import { useBlockNumber } from 'wagmi';
import { Block } from 'viem';

// TODO: make into context
const useMetaStore = () => {
  const currentTs = useRef(new Map<NetworkID, number>([]));
  const currentBlocks = useRef(new Map<NetworkID, number>([]));
  const blocks = useBlocks();
  const blockNumber = useBlockNumber();

  const getCurrent = (networkId: NetworkID): number | undefined => {
    
    if (evmNetworks.includes(networkId)) return currentBlocks.current.get(networkId);
    return currentTs.current.get(networkId);
  };

  const fetchBlock = async (networkId: NetworkID) => {
    if (currentBlocks.current.get(networkId)) return;

    const client = getClient(getNetwork(networkId).currentChainId);
    
    try {
      const block = await client.getBlock()
      currentBlocks.current.set(networkId, Number(block.number));      
      currentTs.current.set(networkId, Number(block.timestamp));
      return block;      
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrentFromDuration = (networkId: NetworkID, duration: number) => {
    const network = getNetwork(networkId);

    if (network.currentUnit === 'second') return duration;

    return Math.round(duration / METADATA[networkId].blockTime);
  };

  const getDurationFromCurrent = (networkId: NetworkID, current: number) => {
    const network = getNetwork(networkId);

    if (network.currentUnit === 'second') return current;

    return Math.round(current * METADATA[networkId].blockTime);
  };

  const getTsFromCurrent = (networkId: NetworkID, currentBlock: Block, current: number) => {   
   
    if (!evmNetworks.includes(networkId)) {      
      return current;
    }    
    
    const networkBlockNum = currentBlock.number;    
    
    const blockDiff = Number(networkBlockNum) - current;
    
    return (Number(currentBlock.timestamp)) - METADATA[networkId].blockTime * blockDiff;
  };

  return {
    getCurrent,
    fetchBlock,
    getCurrentFromDuration,
    getDurationFromCurrent,
    getTsFromCurrent,
    currentTs,
    currentBlocks
  };
};

export default useMetaStore;
