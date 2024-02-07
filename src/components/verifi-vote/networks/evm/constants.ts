import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { getUrl, shorten } from '../../helpers/utils';

import type { StrategyConfig } from '../types';

import { MAX_SYMBOL_LENGTH } from '../../helpers/constants';
import { addresses } from './deployments/mainnet';
import { StrategyParsedMetadata } from '../../types';
import { decodeAbiParameters, encodeAbiParameters, parseAbiParameters } from 'viem';
export const SUPPORTED_AUTHENTICATORS = {
  [addresses.EthTxAuthenticator]: true,
  [addresses.EthSigAuthenticator]: true
};

export const CONTRACT_SUPPORTED_AUTHENTICATORS = {
  [addresses.EthTxAuthenticator]: true,
  // [addresses.EthSigAuthenticator]: true
};

export const SUPPORTED_STRATEGIES = {
  [addresses.VanillaVotingStrategy]: true,
  [addresses.CompVotingStrategy]: true,
  [addresses.OZVotesVotingStrategy]: true,
  [addresses.MerkleWhitelistVotingStrategy]: true
};

export const SUPPORTED_EXECUTORS = {
  SimpleQuorumAvatar: true,
  SimpleQuorumTimelock: true
};

export const RELAYER_AUTHENTICATORS = {
  [addresses.EthSigAuthenticator]: 'evm'
} as const;

export const AUTHS = {
  [addresses.EthSigAuthenticator]: 'Ethereum signature',
  [addresses.EthTxAuthenticator]: 'Ethereum transaction'
};

export const PROPOSAL_VALIDATIONS = {
  [addresses.PropositionPowerProposalValidationStrategy]: 'Voting power'
};

export const STRATEGIES = {
  [addresses.VanillaVotingStrategy]: 'Vanilla',
  [addresses.OZVotesVotingStrategy]: 'ERC-20 Votes (EIP-5805)',
  [addresses.CompVotingStrategy]: 'ERC-20 Votes Comp (EIP-5805)',
  [addresses.MerkleWhitelistVotingStrategy]: 'Merkle whitelist'
};

export const EXECUTORS = {
  SimpleQuorumAvatar: 'Safe module (Zodiac)',
  SimpleQuorumTimelock: 'Timelock'
};

export const EDITOR_AUTHENTICATORS = [
  {
    address: addresses.EthTxAuthenticator,
    name: 'Ethereum transaction',
    about:
      'Will authenticate a user by checking if the caller address corresponds to the author or voter address.',
    icon: {},
    paramsDefinition: null
  },
  {
    address: addresses.EthSigAuthenticator,
    name: 'Ethereum signature',
    about:
      'Will authenticate a user based on an EIP-712 message signed by an Ethereum private key.',
    icon: {},
    paramsDefinition: null
  }
];

export const EDITOR_PROPOSAL_VALIDATIONS = [
  {
    address: addresses.PropositionPowerProposalValidationStrategy,
    type: 'VotingPower',
    name: 'Voting power',
    icon: {},
    validate: (params: Record<string, any>) => {
      return params?.strategies?.length > 0;
    },
    generateSummary: (params: Record<string, any>) => `(${params.threshold})`,
    generateParams: (params: Record<string, any>) => {
      // const abiCoder = new AbiCoder();

      const strategies = params.strategies.map((strategy: StrategyConfig) => {
        return {
          addr: strategy.address,
          params: strategy.generateParams ? strategy.generateParams(strategy.params)[0] : '0x00'
        };
      });

      return [
        encodeAbiParameters(
          parseAbiParameters('uint256, (address addr, bytes params)[]'),
          [params.threshold, strategies]
        )
      ];
    },    
    parseParams: async (params: string) => {
      // const abiCoder = new AbiCoder();
      const threshold = decodeAbiParameters(
        parseAbiParameters('uint256, (address addr, bytes params)[]'),
        params as `0x${string}`
      )
      return {
        // threshold: abiCoder.decode(['uint256', 'tuple(address addr, bytes params)[]'], params)[0]
        threshold
      };
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: ['threshold'],
      properties: {
        threshold: {
          type: 'integer',
          title: 'Proposal threshold',
          examples: ['1']
        }
      }
    }
  }
];

export const EDITOR_VOTING_STRATEGIES = [
  {
    address: addresses.VanillaVotingStrategy,
    name: 'Vanilla',
    about:
      'A strategy that gives one voting power to anyone. It should only be used for testing purposes and not in production.',
    icon: {},
    generateMetadata: async (params: Record<string, any>) => ({
      name: 'Vanilla',
      properties: {
        symbol: params.symbol,
        decimals: 0
      }
    }),
    parseParams: async (params: string, metadata: StrategyParsedMetadata | null) => {
      if (!metadata) throw new Error('Missing metadata');

      return {
        symbol: metadata.symbol
      };
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: [],
      properties: {
        symbol: {
          type: 'string',
          maxLength: MAX_SYMBOL_LENGTH,
          title: 'Symbol',
          examples: ['e.g. VP']
        }
      }
    }
  },
  {
    address: addresses.MerkleWhitelistVotingStrategy,
    name: 'Whitelist',
    about:
      'A strategy that defines a list of addresses each with designated voting power, using a Merkle tree for verification.',
    generateSummary: (params: Record<string, any>) => {
      const length = params.whitelist.trim().length === 0 ? 0 : params.whitelist.split('\n').length;

      return `(${length} ${length === 1 ? 'address' : 'addresses'})`;
    },
    generateParams: (params: Record<string, any>) => {
      const whitelist = params.whitelist.split('\n').map((item: string) => {
        const [address, votingPower] = item.split(':');

        return [address, BigInt(votingPower)];
      });

      const tree = StandardMerkleTree.of(whitelist, ['address', 'uint96']);
      
      return encodeAbiParameters(
        parseAbiParameters('bytes32'),
        [tree.root as `0x${string}`]
      )

      // const abiCoder = new AbiCoder();

      // return [abiCoder.encode(['bytes32'], [tree.root])];
    },
    parseParams: async (params: string, metadata: StrategyParsedMetadata | null) => {
      if (!metadata) throw new Error('Missing metadata');

      const getWhitelist = async (payload: string) => {
        const metadataUrl = getUrl(payload);

        if (!metadataUrl) return '';

        const res = await fetch(metadataUrl);
        const { tree } = await res.json();
        return tree.map((item: any) => `${item.address}:${item.votingPower}`).join('\n');
      };

      return {
        symbol: metadata.symbol,
        whitelist: metadata.payload ? await getWhitelist(metadata.payload) : ''
      };
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: [],
      properties: {
        whitelist: {
          type: 'string',
          format: 'long',
          title: 'Whitelist',
          examples: ['0x556B14CbdA79A36dC33FcD461a04A5BCb5dC2A70:40']
        },
        symbol: {
          type: 'string',
          maxLength: 6,
          title: 'Symbol',
          examples: ['e.g. VP']
        }
      }
    }
  },
  {
    address: addresses.OZVotesVotingStrategy,
    name: 'ERC-20 Votes (EIP-5805)',
    about:
      'A strategy that allows delegated balances of OpenZeppelin style checkpoint tokens to be used as voting power.',
      icon: {},
    generateSummary: (params: Record<string, any>) =>
      `(${shorten(params.contractAddress)}, ${params.decimals})`,
    generateParams: (params: Record<string, any>) => [params.contractAddress],
    generateMetadata: async (params: Record<string, any>) => ({
      name: 'ERC-20 Votes (EIP-5805)',
      properties: {
        symbol: params.symbol,
        decimals: parseInt(params.decimals),
        token: params.contractAddress
      }
    }),
    parseParams: async (params: string, metadata: StrategyParsedMetadata | null) => {
      if (!metadata) throw new Error('Missing metadata');

      return {
        contractAddress: metadata.token,
        decimals: metadata.decimals,
        symbol: metadata.symbol
      };
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: ['contractAddress', 'decimals'],
      properties: {
        contractAddress: {
          type: 'string',
          format: 'address',
          title: 'Token address',
          examples: ['0x0000…']
        },
        decimals: {
          type: 'integer',
          title: 'Decimals',
          examples: ['18']
        },
        symbol: {
          type: 'string',
          maxLength: MAX_SYMBOL_LENGTH,
          title: 'Symbol',
          examples: ['e.g. UNI']
        }
      }
    }
  },
  {
    address: addresses.CompVotingStrategy,
    name: 'ERC-20 Votes Comp (EIP-5805)',
    about:
      'A strategy that allows delegated balances of Compound style checkpoint tokens to be used as voting power.',
      icon: {},
    generateSummary: (params: Record<string, any>) =>
      `(${shorten(params.contractAddress)}, ${params.decimals})`,
    generateParams: (params: Record<string, any>) => [params.contractAddress],
    generateMetadata: async (params: Record<string, any>) => ({
      name: 'ERC-20 Votes Comp (EIP-5805)',
      properties: {
        symbol: params.symbol,
        decimals: parseInt(params.decimals),
        token: params.contractAddress
      }
    }),
    parseParams: async (params: string, metadata: StrategyParsedMetadata | null) => {
      if (!metadata) throw new Error('Missing metadata');

      return {
        contractAddress: metadata.token,
        decimals: metadata.decimals,
        symbol: metadata.symbol
      };
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: ['contractAddress', 'decimals'],
      properties: {
        contractAddress: {
          type: 'string',
          format: 'address',
          title: 'Token address',
          examples: ['0x0000…']
        },
        decimals: {
          type: 'integer',
          title: 'Decimals',
          examples: ['18']
        },
        symbol: {
          type: 'string',
          maxLength: MAX_SYMBOL_LENGTH,
          title: 'Symbol',
          examples: ['e.g. UNI']
        }
      }
    }
  }
];

export const EDITOR_PROPOSAL_VALIDATION_VOTING_STRATEGIES = EDITOR_VOTING_STRATEGIES;

export const EDITOR_EXECUTION_STRATEGIES = [
  {
    address: '',
    type: 'SimpleQuorumAvatar',
    name: EXECUTORS.SimpleQuorumAvatar,
    about:
      'An execution strategy that allows proposals to execute transactions from a specified Safe. PLEASE NOTE: You must add a custom Zodiac module with the address of your space to your safe AFTER you create this space in order to execute the transations.',
    icon: {},
    generateSummary: (params: Record<string, any>) =>
      `(${params.quorum}, ${shorten(params.contractAddress)})`,
    deploy: async (
      client: any,
      signer: any,
      controller: string,
      spaceAddress: string,
      params: Record<string, any>
    ): Promise<{ address: string; txId: string }> => {
      return client.deployAvatarExecution({
        signer,
        params: {
          controller,
          target: params.contractAddress,
          spaces: [spaceAddress],
          quorum: BigInt(params.quorum)
        }
      });
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: ['quorum', 'contractAddress'],
      properties: {
        quorum: {
          type: 'integer',
          title: 'Quorum',
          examples: ['1']
        },
        contractAddress: {
          type: 'string',
          format: 'address',
          title: 'Safe address',
          examples: ['0x0000…']
        }
      }
    }
  },
  {
    address: '',
    type: 'SimpleQuorumTimelock',
    name: EXECUTORS.SimpleQuorumTimelock,
    about:
      'Timelock implementation with a specified delay that queues proposal transactions for execution and includes an optional role to veto queued proposals.',
    icon: {},
    generateSummary: (params: Record<string, any>) => `(${params.quorum}, ${params.timelockDelay})`,
    deploy: async (
      client: any,
      signer: any,
      controller: string,
      spaceAddress: string,
      params: Record<string, any>
    ): Promise<{ address: string; txId: string }> => {
      return client.deployTimelockExecution({
        signer,
        params: {
          controller,
          vetoGuardian: params.vetoGuardian || '0x0000000000000000000000000000000000000000',
          spaces: [spaceAddress],
          timelockDelay: BigInt(params.timelockDelay),
          quorum: BigInt(params.quorum)
        }
      });
    },
    paramsDefinition: {
      type: 'object',
      title: 'Params',
      additionalProperties: false,
      required: ['quorum', 'timelockDelay'],
      properties: {
        quorum: {
          type: 'integer',
          title: 'Quorum',
          examples: ['1']
        },
        vetoGuardian: {
          type: 'string',
          format: 'address',
          title: 'Veto guardian address',
          examples: ['0x0000…']
        },
        timelockDelay: {
          type: 'integer',
          format: 'duration',
          title: 'Timelock delay'
        }
      }
    }
  }
];
