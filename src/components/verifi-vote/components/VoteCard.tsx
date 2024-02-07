import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';


import type { Proposal as ProposalType, Choice, Vote, Space } from '../types';
import { getNetwork, enabledNetworks } from '../networks';
import { useAccount } from 'wagmi';
import useMetaStore from '../stores/meta';
import useUiStore from '../stores/ui';
import VerifiButton from './VerifiButton';
import { useActions } from '../composables/useActions';
import { VotingPower } from '../networks/types';
import VotingPowerIndicator from './VotingPowerIndicator';
import VerifiTooltip from './VerifiTooltip';
import { getBlock, useBlocks } from '../networks/evm';

interface VoteCardProps {
  proposal: ProposalType;
  votingPowers: VotingPower[];
}

const VoteCard: React.FC<VoteCardProps & PropsWithChildren> = ({ proposal, votingPowers, children }) => {
  const uiStore = useUiStore();
  const network = useMemo(() => (proposal.network ? getNetwork(proposal.network) : null), [proposal.network]);

  const { getTsFromCurrent } = useMetaStore();
  const [votes, setVotes] = useState<{ [key: string]: Vote }>();
  const { address } = useAccount()
  const { vote } = useActions();
  const [sendingType, setSendingType] = useState<number | null>(null);

  const votingPower = useMemo(
    () => votingPowers.reduce((acc, b) => acc + BigInt(b.value), BigInt(0)),
    [votingPowers]
  );

  const handleVoteClick = async (choice: Choice) => {
    setSendingType(choice);

    try {
      await vote(proposal, choice);
    } finally {
      setSendingType(null);
    }
  };

  const loadVotes = useCallback(async () => {
    const allNetworkVotes: {
      [key: string]: Vote;
    }[] = await Promise.all(
      enabledNetworks.map(networkId => {
        const network = getNetwork(networkId);
        return network.api.loadUserVotes(address as string);
      })
    );

    setVotes(allNetworkVotes.reduce((acc, b) => ({ ...acc, ...b })));
  }, [address])

  // Load votes on mount if they have not been loaded and the proposal exists
  useEffect(() => {
    if (!address || !proposal || votes) return;

    loadVotes();
  }, [proposal, address, votes, loadVotes]);

  const blocks = useBlocks();
  const [start, setStart] = useState<number | null>(null);

  const setStartTime = useCallback(async (_proposal: ProposalType) => {
    const block = await getBlock(_proposal.network)
    setStart(getTsFromCurrent(_proposal.network, block, _proposal.start))
  }, [getTsFromCurrent])

  useEffect(() => {
    if (!proposal || !blocks || start) return;
    setStartTime(proposal)
  }, [proposal, blocks, setStartTime, start]);


  const isSupported = React.useMemo(() => {
    const network = getNetwork(proposal.network);

    const hasSupportedAuthenticator = proposal.space.authenticators.find(
      (authenticator) => network.constants.SUPPORTED_AUTHENTICATORS[authenticator]
    );
    const hasSupportedStrategies = proposal.strategies.find(
      (strategy) => network.constants.SUPPORTED_STRATEGIES[strategy]
    );

    return hasSupportedAuthenticator && hasSupportedStrategies;
  }, [proposal]);

  const showVoteUi = useMemo(() => {

    return (votes &&
      votes[`${proposal.network}:${proposal.id}`] &&
      proposal.state !== 'pending' &&
      !['passed', 'rejected', 'executed'].includes(proposal.state) &&
      !proposal.cancelled &&
      !!isSupported! && votingPower > 0)

  }, [votes, proposal.state, proposal.cancelled, proposal.id, proposal.network, isSupported, votingPower]);
  return (
    <div className="mt-8 w-full">


      {votes && votes[`${proposal.network}:${proposal.id}`] && (
        <div>
          You have already voted for this proposal.
        </div>
      )}

      {uiStore.pendingVotes[proposal.id] && (
        <div>
          You have already voted for this proposal.
        </div>
      )}

      {proposal.state === 'pending' && (
        <div >
          Voting for this proposal hasn&apos;t started yet. Voting will start {start}.
        </div>
      )}

      {['passed', 'rejected', 'executed'].includes(proposal.state) && (
        <div>Proposal voting window has ended.</div>
      )}

      {proposal.cancelled && (
        <div >This proposal has been cancelled.</div>
      )}

      {!isSupported && <div slot="unsupported">Voting for this proposal is not supported</div>}


      {showVoteUi &&
        <div className="w-full">

          {!address && (
            <div>
              Connect your wallet to check your voting eligibility.
            </div>
          )}
          {address &&
            <div className="flex justify-between items-center w-full pt-4 mt-4 border-t border-white/20">

              <div className=" relative">
                <VotingPowerIndicator
                  networkId={proposal.network}
                  votingPowerSymbol={proposal.space.voting_power_symbol}
                  loading={false}
                  votingPowers={votingPowers} />
              </div>
              <div className="flex space-x-2 py-2 w-full justify-end ">
                <VerifiTooltip message="For" >
                  <VerifiButton
                    className="w-full !text-green-400 !border-green !w-[40px] flex justify-center items-center !h-[40px] !px-0"
                    // disabled={votingPower < 1}
                    loading={sendingType === 1}
                    onClick={() => handleVoteClick(1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>

                  </VerifiButton>
                </VerifiTooltip>

                <VerifiTooltip message="Against" >
                  <VerifiButton
                    className="w-full !text-red-400 !border-red !w-[40px] !h-[40px] !px-0 flex justify-center items-center "
                    loading={sendingType === 2}
                    // disabled={votingPower < 1}
                    onClick={() => handleVoteClick(2)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>

                  </VerifiButton>
                </VerifiTooltip>

                <VerifiTooltip message="Abstain" >
                  <VerifiButton
                    className="w-full !text-gray-300 !border-gray-500 !w-[40px] !h-[40px] !px-0 flex  justify-center items-center "
                    loading={sendingType === 3}
                    // disabled={votingPower < 1}
                    onClick={() => handleVoteClick(3)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>

                  </VerifiButton>
                </VerifiTooltip>
              </div>


            </div>
          }
          <div>{children}</div>
        </div>}
    </div>
  );
};

export default VoteCard;
