import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Proposal as ProposalType } from '../types';
import { _rt, _n } from '../helpers/utils';
import ProposalTimelineModal from './ProposalTimelineModal';
import VoteCard from './VoteCard';
import useMetaStore from '../stores/meta';
import ProposalStatusIcon from './ProposalStatusIcon';
import { getBlock } from '../networks/evm';
import ProposalResults from './ProposalResults';
import { VotingPower } from '../networks/types';
import { getNetwork } from '../networks';
import { useAccount } from 'wagmi';
import { Block } from 'viem';

const Proposal: FC<{ proposal: ProposalType }> = ({ proposal }) => {

  const [votingPowers, setVotingPowers] = useState<VotingPower[]>([]);
  const [loadingVotingPower, setLoadingVotingPower] = useState(true);
  const { address } = useAccount()
  const { getTsFromCurrent } = useMetaStore();
  const [block, setBlock] = useState<Block | null>(null);

  const fetchVotingPower = useCallback(async () => {
    if (!address) {
      setVotingPowers([]);
      setLoadingVotingPower(false);
      return;
    }
    setLoadingVotingPower(true);

    try {
      if (!proposal) return;
      const network = getNetwork(proposal.network);

      const powers = await network.actions.getVotingPower({
        strategiesAddresses: proposal.strategies,
        strategiesParams: proposal.strategies_params,
        strategiesMetadata: proposal.space.strategies_parsed_metadata,
        voterAddress: address,
        block: BigInt(proposal.snapshot),
      });
      setVotingPowers(powers);
    } catch (e) {
      console.warn('Failed to load voting power', e);
      setVotingPowers([]);
    } finally {
      setLoadingVotingPower(false);
    }
  }, [proposal, address]);

  const votingPowerDecimals = useMemo(
    () => votingPowers.reduce((acc, b) => acc + BigInt(b.value), BigInt(0)),
    [votingPowers]
  );

  const [endTime, setEndTime] = useState<number>(0);

  const getEndTime = useCallback(async (_proposal: ProposalType) => {
    const block = await getBlock(_proposal.network)
    setEndTime(getTsFromCurrent(_proposal.network, block, _proposal.start))
  }, [getTsFromCurrent])

  useEffect(() => {
    if (!proposal) return;
    if (loadingVotingPower) return;
    fetchVotingPower()
  }, [proposal, fetchVotingPower, getEndTime, loadingVotingPower]);

  useEffect(() => {
    const fetchBlock = async () => {
      const fetchedBlock = await getBlock(proposal.network);
      setBlock(fetchedBlock);
    };
    if (!proposal) return;
    if (proposal && !block) {
      fetchBlock();
      return
    }
    getEndTime(proposal)

  }, [proposal, block]);

  const [modalOpenTimeline, setModalOpenTimeline] = useState(false);

  return (
    <div>
      <div className="py-2.5 flex">
        <div className="w-full">
          <div className="flex items-center border-b border-white/10 w-full pb-4 mb-4">
            <h3 className="leading-6 text-[21px] md:truncate md:text-ellipsis">
              {proposal.title || `Proposal #${proposal.proposal_id}`}
            </h3>
          </div>

          <div className="flex items-center font-mono text-xs">
            {proposal.state !== 'active' &&
              <div className="space-x-1 text-[10px] font-mono uppercase tracking-widest flex items-center mr-2">
                <ProposalStatusIcon width="17" height="17" state={proposal.state} /> <span>{proposal.state}</span>
              </div>
            }
            {proposal.vote_count &&
              ` · ${_n(proposal.vote_count, 'compact')} ${proposal.vote_count !== 1 ? 'votes' : 'vote'
              } · `}
            <a
              className="text-white/50 ml-2"
              onClick={() => setModalOpenTimeline(true)}
            >
              {_rt(endTime)}
            </a>

          </div>

          <p className="py-4 text-xs">{proposal.body}</p>
        </div>

      </div>
      <div className="pt-4">
        <VoteCard proposal={proposal} votingPowers={votingPowers} />
      </div>
      {!proposal.cancelled && proposal.state !== 'pending' && proposal.vote_count &&
        <div className="mt-4 w-full border-t pt-4 border-white/10 ">
          <h4 className="block mb-2 mt-4 first:mt-1 uppercase text-[10px] tracking-widest font-mono text-white/80">Results</h4>
          <ProposalResults withDetails proposal={proposal} decimals={Number(votingPowerDecimals)} /></div>
      }
      <div className="relative">
        <ProposalTimelineModal
          open={modalOpenTimeline}
          proposal={proposal}
          onClose={() => setModalOpenTimeline(false)}
        />
      </div>
    </div>
  );
};

export default Proposal;
