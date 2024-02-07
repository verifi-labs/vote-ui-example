import React, { useEffect, useMemo, useState } from 'react';
import { _t } from '../helpers/utils';
import { Proposal } from '../types';
import useMetaStore from '../stores/meta';
import { getBlock, useBlocks } from '../networks/evm';
import { Block } from 'viem';


interface ProposalTimelineModalProps {
  open: boolean;
  proposal: Proposal;
  onClose: () => void;
}

const ProposalTimelineModal: React.FC<ProposalTimelineModalProps> = ({ open, proposal, onClose }) => {

  const labels: { [key: string]: string } = {
    created: 'Created',
    start: 'Start',
    end: 'End',
    min_end: 'Min. end',
    max_end: 'Max. end',
  };

  const [block, setBlock] = useState<Block | null>(null);

  useEffect(() => {
    const fetchBlock = async () => {
      const fetchedBlock = await getBlock(proposal.network);
      setBlock(fetchedBlock);
    };

    if (proposal && !block) {
      fetchBlock();
    }
  }, [proposal, open, block]);


  const { getTsFromCurrent, currentTs } = useMetaStore();

  const states = useMemo(() => {
    const network = proposal.network;

    if (!block) return [];
    if (proposal.min_end === proposal.max_end) {
      return [
        {
          id: 'created',
          value: proposal.created,
        },
        {
          id: 'start',
          block_number: proposal.start,
          value: getTsFromCurrent(network, block, proposal.start),
        },
        {
          id: 'end',
          block_number: proposal.min_end,
          value: getTsFromCurrent(network, block, proposal.min_end),
        },
      ];
    }

    return [
      {
        id: 'created',
        value: proposal.created,
      },
      {
        id: 'start',
        block_number: proposal.start,
        value: getTsFromCurrent(network, block, proposal.start),
      },
      {
        id: 'min_end',
        block_number: proposal.min_end,
        value: getTsFromCurrent(network, block, proposal.min_end),
      },
      {
        id: 'max_end',
        block_number: proposal.max_end,
        value: getTsFromCurrent(network, block, proposal.max_end),
      },
    ];
  }, [proposal, block, getTsFromCurrent]);

  const now = parseInt((Date.now() / 1e3).toFixed());

  return (
    <>

      {open &&
        <div className="fixed w-screen h-screen flex items-center justify-center transition-all top-0 left-0 bg-black/20 backdrop-blur-sm" onClick={() => onClose()}>
          <div className="p-8 pb-0 bg-black/80 border border-white/30 rounded-xl shadow-blue-400/30 shadow-2xl">
            <div className="border-b border-b-white/50 py-2 mb-4">
              <h3 className="text-sm uppercase tracking-widest opacity-90">Timeline</h3>
            </div>
            <div>
              <div className="p-4 pr-6 flex flex-column">
                <div className="mt-1 ml-2">
                  {states.map((state, i) => (
                    <div key={`label-${state.id}`} className="flex relative h-[80px] last:h-[60px]">
                      <div
                        className={`absolute w-[15px] h-[15px] inline-block rounded-full -left-[7px] border-[4px] border-white/10 ${state.value <= now ? 'bg-white/10' : 'bg-white/40'
                          }`}
                      />
                      {states[i + 1] && (
                        <div
                          className={`border-l pr-4 mt-3 ${states[i + 1].value <= now ? 'border-white/20' : ''
                            }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex-auto leading-6">
                  {states.map((state) => (
                    <div key={`val-${state.id}`} className="ml-3 mb-3 last:mb-0 h-[66px] last:h-[40px]">
                      <h4 className="text-xs uppercase tracking-widest opacity-90">{labels[state.id]}</h4>
                      <span className="font-mono text-sm">{_t(state.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default ProposalTimelineModal;
