"use client"

import React, { FC, useMemo, useState } from 'react';;
import { NetworkID } from './types';
import useProposalsStore, { ProposalFilter } from './stores/proposals';
import Proposal from './components/Proposal';
import useSpaceStore from './stores/space';


const VerifiModal: FC<{ spaceId: string, networkId: NetworkID }> = ({ spaceId, networkId }) => {

  // TODO implement selector for filter
  const [filter, setFilter] = useState<ProposalFilter>('active')
  const { proposals, error: proposalError } = useProposalsStore(spaceId, networkId, filter);
  const { space, error: spaceError, isLoading: loadingSpace } = useSpaceStore(spaceId, networkId);

  const proposalsRecord = useMemo(() => {
    return proposals[`${networkId}:${spaceId}`];
  }, [proposals, networkId, spaceId]);

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <div className="uppercase tracking-widest font-mono text-[10px] opacity-90 pb-2 w-full border-b border-white/20">Your Space</div>
        <div className="mt-2 mb-6">
          <h3 className="text-2xl">{space?.name ? space?.name : 'Loading space...'}</h3>
          <div className="uppercase tracking-widest font-mono text-[10px] opacity-30 pt-1">{space && <span>{space?.network}:{space?.controller} </span>} </div>
        </div>

      </div>
      {spaceError && <div>{spaceError.message}</div>}
      <div>
        <h4 className="uppercase tracking-widest font-mono text-[10px] opacity-90 pb-2 w-full border-b border-white/20 ">
          Proposals
        </h4>
        {proposalError && <div>{proposalError.message}</div>}
        <div>
          {proposalsRecord?.proposals ? Object.values(proposalsRecord?.proposals).map((proposal, i) => (
            <div key={`${i} ${proposal.id}`} >
              <Proposal proposal={proposal} />
            </div>
          )) : <div className="mt-4">{proposalsRecord?.loaded ? `No ${filter} proposals found.` : 'Loading proposals...'}</div>}
        </div>
      </div>
    </div>
  );
};

export default VerifiModal;