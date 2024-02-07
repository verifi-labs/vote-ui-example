import {
  clients,
  getEvmStrategy,
  evmArbitrum,
  evmPolygon,
  evmMainnet,
  evmGoerli,
  evmSepolia,
  evmLineaGoerli,
  EvmNetworkConfig
} from '@verifi/verifi.js';
import { MANA_URL } from '../../helpers/mana';
import {  
  parseStrategyMetadata,
  createStrategyPicker
} from '../../networks/common/helpers';
import { EVM_CONNECTORS } from '../../networks/common/constants';
import {
  CONTRACT_SUPPORTED_AUTHENTICATORS,
  RELAYER_AUTHENTICATORS,
  SUPPORTED_AUTHENTICATORS,
  SUPPORTED_STRATEGIES
} from './constants';
import type {
  Connector,
  NetworkActions,
  NetworkHelpers,
  VotingPower
} from '../../networks/types';
import type {Proposal, StrategyParsedMetadata } from '../../types';
import { BlockTag, PublicClient } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { getNetwork } from '..';



type Choice = 0 | 1 | 2;


const CONFIGS: Record<number, EvmNetworkConfig> = {
  137: evmPolygon,
  42161: evmArbitrum,
  1: evmMainnet,
  5: evmGoerli,
  11155111: evmSepolia,
  59140: evmLineaGoerli
};

export function createActions(
  //provider: Provider,
  helpers: NetworkHelpers,
  chainId: number
): NetworkActions {
  const networkConfig = CONFIGS[chainId];

  const pickAuthenticatorAndStrategies = createStrategyPicker({
    supportedAuthenticators: SUPPORTED_AUTHENTICATORS,
    supportedStrategies: SUPPORTED_STRATEGIES,
    contractSupportedAuthenticators: CONTRACT_SUPPORTED_AUTHENTICATORS,
    relayerAuthenticators: RELAYER_AUTHENTICATORS,
    managerConnectors: EVM_CONNECTORS
  });

  const client = new clients.EvmEthereumTx({ networkConfig });
  const ethSigClient = new clients.EvmEthereumSig({
    networkConfig,
    manaUrl: MANA_URL
  });

  // const getIsContract = async (address: string) => {
  //   const code = await provider.getCode(address);
  //   return code !== '0x';
  // };

  return {
    vote: async (
      walletClient: any,
      connectorType: Connector,
      account: string,
      proposal: Proposal,
      choice: number,
    ) => {
      // await verifyNetwork(web3, chainId);

      if (choice < 1 || choice > 3) throw new Error('Invalid chocie');

      const isContract = false //await getIsContract(account);

      const { relayerType, authenticator, strategies } = pickAuthenticatorAndStrategies({
        authenticators: proposal.space.authenticators,
        strategies: proposal.strategies,
        strategiesIndicies: proposal.strategies_indicies,
        connectorType,
        isContract
      });

      let convertedChoice: Choice = 0;
      if (choice === 1) convertedChoice = 1;
      if (choice === 2) convertedChoice = 0;
      if (choice === 3) convertedChoice = 2;

      const strategiesWithMetadata = await Promise.all(
        strategies.map(async strategy => {
          const metadataIndex = proposal.strategies_indicies.indexOf(strategy.index);

          const metadata = await parseStrategyMetadata(
            proposal.space.strategies_parsed_metadata[metadataIndex].payload
          );

          return {
            ...strategy as { address: `0x${string}`, index: number},
            metadata
          };
        })
      );

      const data = {
        space: proposal.space.id as `0x${string}`,
        authenticator,
        strategies: strategiesWithMetadata,
        proposal: proposal.proposal_id as number,
        choice: convertedChoice,
        metadataUri: ''
      };

      // if (relayerType === 'evm') {
      //   return ethSigClient.vote({
      //     walletClient,
      //     data
      //   });
      // }

      return client.vote(
        {
          walletClient,
          envelope: {
            data
          }
        },
        { noWait: isContract }
      );
    },
  
    send: (envelope: any) => ethSigClient.send(envelope),
    getVotingPower: async ({
      strategiesAddresses,
      strategiesParams,
      strategiesMetadata,
      voterAddress,
      block,      
    }
    ): Promise<VotingPower[]> => {

      const publicClient = getPublicClient({chainId});
      if (block === null) throw new Error('EVM requires block number to be defined');

      return Promise.all(
        strategiesAddresses.map(async (strategyAddress, i) => {
          const strategy = getEvmStrategy(strategyAddress, networkConfig);
          if (!strategy) return { strategyAddress, value: BigInt(0), decimals: 0, token: null, symbol: '' };

          const metadata = await parseStrategyMetadata(strategiesMetadata[i].payload);
          
          const value = await strategy.getVotingPower({
            strategyAddress,
            voterAddress,
            metadata,
            block,
            params: strategiesParams[i],
            publicClient
          });

          const token = ['comp', 'ozVotes'].includes(strategy.type)
            ? strategiesParams[i]
            : undefined;
          return {
            strategyAddress,
            value,
            decimals: strategiesMetadata[i]?.decimals ?? 0,
            symbol: strategiesMetadata[i]?.symbol ?? '',
            token
          };
        })
      );
    }
  };
}
