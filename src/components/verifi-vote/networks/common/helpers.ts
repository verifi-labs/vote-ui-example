import { EVM_CONNECTORS, STARKNET_CONNECTORS } from './constants';
import { getUrl } from '../../helpers/utils';
import { Connector } from '../../networks/types';
import { Space } from '../../types';
import { getExecutionData as _getExecutionData, MetaTransaction } from '@verifi/verifi.js';


import { mapConnectorId } from '../../helpers/connectors';

type SpaceExecutionData = Pick<Space, 'executors' | 'executors_types'>;
type ExecutorType = Parameters<typeof _getExecutionData>[0];

export function getExecutionData(
  space: SpaceExecutionData,
  executionStrategy: string,
  transactions: MetaTransaction[]
) {
  const supportedExecutionIndex = space.executors.findIndex(
    executor => executor === executionStrategy
  );

  if (supportedExecutionIndex === -1) {
    throw new Error('No supported executor configured for this space');
  }

  const executorType = space.executors_types[supportedExecutionIndex] as ExecutorType;
  return _getExecutionData(executorType, executionStrategy, {
    transactions
  });
}

export async function parseStrategyMetadata(metadata: string | null) {
  if (metadata === null) return null;
  if (!metadata.startsWith('ipfs://')) return JSON.parse(metadata);

  const strategyUrl = getUrl(metadata);
  if (!strategyUrl) return null;

  const res = await fetch(strategyUrl);
  return res.json();
}

export function createStrategyPicker({
  supportedAuthenticators,
  supportedStrategies,
  contractSupportedAuthenticators,
  relayerAuthenticators,
  managerConnectors,
  lowPriorityAuthenticators = []
}: {
  supportedAuthenticators: Record<string, boolean | undefined>;
  supportedStrategies: Record<string, boolean | undefined>;
  contractSupportedAuthenticators: Record<string, boolean | undefined>;
  relayerAuthenticators: Record<string, 'evm' | 'evm-tx' | 'starknet' | undefined>;
  managerConnectors: Connector[];
  lowPriorityAuthenticators?: ('evm' | 'evm-tx' | 'starknet')[];
}) {
  return function pick({
    authenticators,
    strategies,
    strategiesIndicies,
    isContract,
    connectorType
  }: {
    authenticators: string[];
    strategies: string[];
    strategiesIndicies: number[];
    isContract: boolean;
    connectorType: Connector;
  }) {
    connectorType = mapConnectorId(connectorType) as Connector;
    console.log('authenticators', authenticators)
    const authenticatorsInfo = [...authenticators]
      .filter(authenticator =>
        isContract
          ? contractSupportedAuthenticators[authenticator]
          : supportedAuthenticators[authenticator]
      )
      .sort((a, b) => {
        const aRelayer = relayerAuthenticators[a];
        const bRelayer = relayerAuthenticators[b];
        const aLowPriority = aRelayer && lowPriorityAuthenticators.includes(aRelayer);
        const bLowPriority = bRelayer && lowPriorityAuthenticators.includes(bRelayer);

        if (aLowPriority && !bLowPriority) {
          return 1;
        }

        if (!aLowPriority && bLowPriority) {
          return -1;
        }

        if (aRelayer && bRelayer) {
          return 0;
        }

        if (aRelayer) {
          return -1;
        }

        if (bRelayer) {
          return 1;
        }

        return 0;
      })
      .map(authenticator => {
        const relayerType = relayerAuthenticators[authenticator];

        let connectors: Connector[] = [];
        if (relayerType && ['evm', 'evm-tx'].includes(relayerType)) connectors = EVM_CONNECTORS;
        else if (relayerType === 'starknet') connectors = STARKNET_CONNECTORS;
        else connectors = managerConnectors;

        return {
          authenticator,
          relayerType,
          connectors
        };
      });
console.log('connectorType',connectorType)
    const authenticatorInfo = authenticatorsInfo.find(({ connectors }) =>
      connectors.includes(connectorType)
    );
console.log('authenticatorsInfo', authenticatorsInfo)
    const selectedStrategies = strategies
      .map((strategy, index) => ({ address: strategy, index: strategiesIndicies[index] }) as const)
      .filter(({ address }) => supportedStrategies[address]);

    if (!authenticatorInfo || (strategies.length !== 0 && selectedStrategies.length === 0)) {
      console.log('authenticatorInfo', authenticatorInfo)
      console.log('supportedStrategies', supportedStrategies)
      console.log('strategies', strategies)
      console.log('selectedStrategies', selectedStrategies)      
      throw new Error('Unsupported space');
    }

    return {
      relayerType: authenticatorInfo.relayerType,
      authenticator: authenticatorInfo.authenticator,
      strategies: selectedStrategies
    };
  };
}
