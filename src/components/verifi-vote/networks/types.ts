// import { FunctionalComponent } from 'vue';
// import type { Web3Provider } from '@ethersproject/providers';
// import type { Signer } from '@ethersproject/abstract-signer';

import { BlockTag } from 'starknet';
import type {
  Space,
  SpaceMetadata,
  Proposal,
  Vote,
  User,
  Choice,
  NetworkID,
  StrategyParsedMetadata
} from '../types';
import { BlockNumber, PublicClient } from 'viem';

export type PaginationOpts = { limit: number; skip?: number };
export type SpacesFilter = {
  controller?: string;
  id_in?: string[];
};
export type Connector = 'argentx' | 'injected' | 'walletconnect' | 'walletlink' | 'gnosis';
export type GeneratedMetadata =
  | {
      name: string;
      description?: string;
      properties: {
        symbol?: string;
        decimals: number;
        token?: string;
        payload?: string;
      };
    }
  | {
      strategies_metadata: string[];
    };

export type StrategyTemplate = {
  address: string;
  name: string;
  about?: string;
  icon?: any;
  type?: string;
  paramsDefinition: any;
  validate?: (params: Record<string, any>) => boolean;
  generateSummary?: (params: Record<string, any>) => string;
  generateParams?: (params: Record<string, any>) => any[];
  generateMetadata?: (params: Record<string, any>) => Promise<GeneratedMetadata>;
  parseParams?: (
    params: string,
    metadata: StrategyParsedMetadata | null
  ) => Promise<Record<string, any>>;
  deploy?: (
    client: any,
    signer: any,
    controller: string,
    spaceAddress: string,
    params: Record<string, any>
  ) => Promise<{ address: string; txId: string }>;
};

export type StrategyConfig = StrategyTemplate & {
  id: string;
  params: Record<string, any>;
};

export type VotingPower = {
  strategyAddress: `0x${string}`;
  value: bigint;
  decimals: number;
  token: string | null;
  symbol: string;
};

// TODO: make verifi.js accept Signer instead of Web3Provider | Wallet

export type VotingPowerParams = {
  strategiesAddresses: `0x${string}`[];
  strategiesParams: any[];
  strategiesMetadata: StrategyParsedMetadata[];
  voterAddress: `0x${string}`;  
  block: BlockNumber;
};

type ReadOnlyNetworkActions = {
  getVotingPower(params: VotingPowerParams): Promise<VotingPower[]>;
};

export type NetworkActions = ReadOnlyNetworkActions & {
  vote(
    walletClient: any,
    connectorType: Connector,
    account: string,
    proposal: Proposal,
    choice: Choice,
  ): Promise<any>;
  send(envelope: any): Promise<any>;
};

export type NetworkApi = {
  loadProposalVotes(
    proposal: Proposal,
    paginationOpts: PaginationOpts,
    filter?: 'any' | 'for' | 'against' | 'abstain',
    sortBy?: 'vp-desc' | 'vp-asc' | 'created-desc' | 'created-asc'
  ): Promise<Vote[]>;
  loadUserVotes(voter: string): Promise<{ [key: string]: Vote }>;
  loadProposals(
    spaceId: string,
    paginationOpts: PaginationOpts,
    current: number,
    filter?: 'any' | 'active' | 'pending' | 'closed',
    searchQuery?: string
  ): Promise<Proposal[]>;
  loadProposal(
    spaceId: string,
    proposalId: number | string,
    current: number
  ): Promise<Proposal | null>;
  loadSpaces(paginationOpts: PaginationOpts, filter?: SpacesFilter): Promise<Space[]>;
  loadSpace(spaceId: string): Promise<Space | null>;
  loadUser(userId: string): Promise<User | null>;
};

export type NetworkConstants = {
  SUPPORTED_AUTHENTICATORS: { [key: string]: boolean };
  CONTRACT_SUPPORTED_AUTHENTICATORS: { [key: string]: boolean };
  SUPPORTED_STRATEGIES: { [key: string]: boolean };
  SUPPORTED_EXECUTORS: { [key: string]: boolean };
  RELAYER_AUTHENTICATORS: { [key: string]: 'evm' | 'evm-tx' | 'starknet' | undefined };
  AUTHS: { [key: string]: string };
  PROPOSAL_VALIDATIONS: { [key: string]: string };
  STRATEGIES: { [key: string]: string };
  EXECUTORS: { [key: string]: string };
  EDITOR_AUTHENTICATORS: StrategyTemplate[];
  EDITOR_PROPOSAL_VALIDATIONS: StrategyTemplate[];
  EDITOR_VOTING_STRATEGIES: StrategyTemplate[];
  EDITOR_PROPOSAL_VALIDATION_VOTING_STRATEGIES: StrategyTemplate[];
  EDITOR_EXECUTION_STRATEGIES: StrategyTemplate[];
};

export type NetworkHelpers = {  
  waitForTransaction(txId: string): Promise<any>;
  waitForSpace(spaceAddress: string, interval?: number): Promise<Space>;
  getExplorerUrl(id: string, type: 'transaction' | 'address' | 'contract' | 'token'): string;
};

type BaseNetwork = {
  name: string;
  avatar: string;
  currentUnit: 'block' | 'second';
  chainId: number;
  baseChainId: number;
  currentChainId: number;
  baseNetworkId?: NetworkID;
  hasReceive: boolean;
  supportsSimulation: boolean;
  managerConnectors: Connector[];
  api: NetworkApi;
  constants: NetworkConstants;
  helpers: NetworkHelpers;
};

export type ReadOnlyNetwork = BaseNetwork & { readOnly: true; actions: ReadOnlyNetworkActions };
export type ReadWriteNetwork = BaseNetwork & { readOnly?: false; actions: NetworkActions };
export type Network = ReadOnlyNetwork | ReadWriteNetwork;
