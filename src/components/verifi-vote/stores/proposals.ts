import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNetwork, enabledNetworks  } from '../networks';
import type { NetworkID, Proposal } from '../types';
import useMetaStore from './meta';


type SpaceRecord = {
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  proposalsIdsList: (string | number)[];
  proposals: Record<number, Proposal>;
  hasMoreProposals: boolean;
  summaryLoading: boolean;
  summaryLoaded: boolean;
  summaryProposals: Proposal[];
};

export type ProposalFilter = 'any' | 'active' | 'pending' | 'closed';

const PROPOSALS_LIMIT = 20;

// TODO: create special _id that is used for UI that is prefixed by networkId
const getUniqueSpaceId = (spaceId: string, networkId: NetworkID) => `${networkId}:${spaceId}`;

const useProposalsStore = (spaceId: string, networkId: NetworkID, filter: ProposalFilter = 'any') => {
  
  const [block, setBlock] = useState<number | null>(null);
  const { fetchBlock, getCurrent } = useMetaStore();
  const [proposals, setProposals] = useState<Partial<Record<string, SpaceRecord>>>({});

  const getSpaceProposals = (spaceId: string, networkId: NetworkID) => {
    const record = proposals[getUniqueSpaceId(spaceId, networkId)];
    if (!record) return [];

    return record.proposalsIdsList.map(proposalId => record.proposals[proposalId as number]);
  };


  const proposalsRecord = useMemo(() => {
    return proposals[`${networkId}:${spaceId}`];
  }, [proposals, networkId, spaceId]);

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  

  const fetchCurrentBlock = useCallback(async (_network: NetworkID) => {
    try {
      setIsLoading(true);
      const _block = await fetchBlock(_network);
      setBlock(Number(_block?.number));
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, fetchBlock]);

  const getProposal = (spaceId: string, proposalId: number | string, networkId: NetworkID) => {
    const record = proposals[getUniqueSpaceId(spaceId, networkId)];
    if (!record) return undefined;

    return record.proposals[proposalId as number];
  };

  const reset = (spaceId: string, networkId: NetworkID) => {
    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);
    setProposals(prevProposals => {
      const updatedProposals = { ...prevProposals };
      delete updatedProposals[uniqueSpaceId];
      return updatedProposals;
    });
  };

  const fetch = useCallback(async (spaceId: string, networkId: NetworkID, filter?: 'any' | 'active' | 'pending' | 'closed') => {
    // await metaStore.fetchBlock(networkId);

    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);
   
    const record = proposals[uniqueSpaceId] || {
      loading: false,
      loadingMore: false,
      loaded: false,
      proposalsIdsList: [],
      proposals: {},
      hasMoreProposals: true,
      summaryLoading: false,
      summaryLoaded: false,
      summaryProposals: []
    };

    if(!record) return;
    if (record.loading || record.loaded) return;
    console.log('record.loading', record.loading)
    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        loading: true
      }
    }));

    try {
      const fetchedProposals = await getNetwork(networkId).api.loadProposals(
        spaceId,
        {
          limit: PROPOSALS_LIMIT
        },
        getCurrent(networkId) || 0,
        filter
      ) as Proposal[];

      setProposals(prevProposals => ({
        ...prevProposals,
        [uniqueSpaceId]: {
          ...record,
          proposalsIdsList: fetchedProposals.map(proposal => proposal.proposal_id),
          proposals: {
            ...record.proposals,
            ...Object.fromEntries(fetchedProposals.map(proposal => [proposal.proposal_id, proposal]))
          },
          hasMoreProposals: fetchedProposals.length === PROPOSALS_LIMIT,
          loaded: true,
          loading: false
        }
      }));
    } catch (error) {
      setError(error as Error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [proposals, setProposals, getCurrent]);

  const fetchMore = useCallback(async (spaceId: string, networkId: NetworkID) => {
    //await fetchBlock(networkId);

    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);

    if (!proposals[uniqueSpaceId]) {
      setProposals(prevProposals => ({
        ...prevProposals,
        [uniqueSpaceId]: {
          loading: false,
          loadingMore: false,
          loaded: false,
          proposalsIdsList: [],
          proposals: {},
          hasMoreProposals: true,
          summaryLoading: false,
          summaryLoaded: false,
          summaryProposals: []
        }
      }));
    }

    const record = proposals[uniqueSpaceId];
    if(!record) return;
    if (record.loading || !record.loaded) return;

    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        loadingMore: true
      }
    }));

    const fetchedProposals = await getNetwork(networkId).api.loadProposals(
      spaceId,
      {
        limit: PROPOSALS_LIMIT,
        skip: record.proposalsIdsList.length
      },
      getCurrent(networkId) || 0
    ) as Proposal[];

    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        proposalsIdsList: [
          ...record.proposalsIdsList,
          ...fetchedProposals.map(proposal => proposal.proposal_id)
        ],
        proposals: {
          ...record.proposals,
          ...Object.fromEntries(fetchedProposals.map(proposal => [proposal.proposal_id, proposal]))
        },
        hasMoreProposals: fetchedProposals.length === PROPOSALS_LIMIT,
        loadingMore: false
      }
    }));
  }, [proposals, setProposals, getCurrent]);

  const fetchSummary = useCallback(async (spaceId: string, networkId: NetworkID, limit = 3) => {
    // await metaStore.fetchBlock(networkId);

    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);

    if (!proposals[uniqueSpaceId]) {
      setProposals(prevProposals => ({
        ...prevProposals,
        [uniqueSpaceId]: {
          loading: false,
          loadingMore: false,
          loaded: false,
          proposalsIdsList: [],
          proposals: {},
          hasMoreProposals: true,
          summaryLoading: false,
          summaryLoaded: false,
          summaryProposals: []
        }
      }));
    }

    const record = proposals[uniqueSpaceId];
    if(!record) return;
    if (record.summaryLoading || record.summaryLoaded) {
      return;
    }

    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        summaryLoading: true
      }
    }));

    const summaryProposals = await getNetwork(networkId).api.loadProposals(
      spaceId,
      { limit },
      getCurrent(networkId) || 0
    );

    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        summaryProposals,
        summaryLoaded: true,
        summaryLoading: false
      }
    }));
  }, [proposals, setProposals, getCurrent]);

  const fetchProposal = useCallback(async (spaceId: string, proposalId: number | string, networkId: NetworkID) => {
    
    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);

    if (!proposals[uniqueSpaceId]) {
      setProposals(prevProposals => ({
        ...prevProposals,
        [uniqueSpaceId]: {
          loading: false,
          loadingMore: false,
          loaded: false,
          proposalsIdsList: [],
          proposals: {},
          hasMoreProposals: true,
          summaryLoading: false,
          summaryLoaded: false,
          summaryProposals: []
        }
      }));
    }

    const record = proposals[uniqueSpaceId];
    if(!record) return;
    
    const proposal = await getNetwork(networkId).api.loadProposal(
      spaceId,
      proposalId,
      getCurrent(networkId) || 0
    ) as Proposal;
    if (!proposal) return;

    setProposals(prevProposals => ({
      ...prevProposals,
      [uniqueSpaceId]: {
        ...record,
        proposals: {
          ...record.proposals,
          [proposalId]: proposal
        }
      }
    }));
  }, [proposals, setProposals, getCurrent]);

  useEffect(() => {
    if (block) return;
    fetchCurrentBlock(networkId);
  }, [isLoading, fetchBlock, networkId, block, fetchCurrentBlock]);


  useEffect(() => {
    const handleEndReached = async () => {
      if (!proposalsRecord?.hasMoreProposals) return;
      fetchMore(spaceId, networkId);
    };

    handleEndReached();
  }, [proposalsRecord, fetchMore, networkId, spaceId]);

  useEffect(() => {
    
    if (!block) return;
    const uniqueSpaceId = getUniqueSpaceId(spaceId, networkId);
    const record = proposals[uniqueSpaceId];
    // if(!record) return;
    if (record?.loading || record?.loaded) return;

    reset(spaceId, networkId);
    fetch(spaceId, networkId, filter);
  }, [block, filter, spaceId, networkId, fetch, proposals]);

  return {
    proposals,
    reset,
    fetch,
    fetchMore,
    fetchSummary,
    fetchProposal,
    getSpaceProposals,
    getProposal,
    isLoading,
    error
  };
};

export default useProposalsStore;
