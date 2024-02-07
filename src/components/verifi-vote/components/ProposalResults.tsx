import React, { useMemo } from 'react';
import type { Proposal as ProposalType } from '../types';
import { _n, _p } from '../helpers/utils';

interface ProposalResultsProps {
  proposal: ProposalType;
  decimals?: number;
  withDetails?: boolean;
  width?: number;
}
const choiceColors: { [key: number]: string } = { 1: 'bg-green-500', 2: 'bg-red-500', 3: 'bg-gray-400' };

const ProposalResults: React.FC<ProposalResultsProps> = ({ proposal, decimals = 0, withDetails = false, width = 100 }) => {
  const labels = ['For', 'Against', 'Abstain'];

  const progress = useMemo(() => Math.min(proposal.scores_total / proposal.quorum, 1), [proposal.scores_total, proposal.quorum]);

  const adjustedScores = useMemo(
    () =>
      [proposal.scores[0], proposal.scores[1], proposal.scores[2]].map((score) => {
        const parsedTotal = Number(proposal.scores_total);
        return parsedTotal !== 0 ? (score / parsedTotal) * 100 * progress : 0;
      }),
    [proposal.scores, proposal.scores_total, progress]
  );

  const results = useMemo(
    () =>
      adjustedScores.map((score, i) => ({
        choice: i + 1,
        score: proposal.scores[i],
        progress: score,
      })).sort((a, b) => b.progress - a.progress),
    [adjustedScores, proposal.scores]
  );

  return (
    <div>
      {proposal.type !== 'basic' ? (
        proposal.choices.map((choice, id) => (
          <div
            key={id}
            className="flex justify-between border rounded-lg p-3 mb-2 last:mb-0 relative overflow-hidden"
          >
            <div className="truncate mr-2 z-10">{choice}</div>
            <div className="z-10">{_p(proposal.scores[id] / (proposal.scores_total || Infinity))}</div>
            <div
              className="absolute bg-skin-border top-0 bottom-0 left-0 pointer-events-none"
              style={{ width: `${((proposal.scores[id] / (proposal.scores_total || Infinity)) * 100).toFixed(2)}%` }}
            />
          </div>
        ))
      ) : (
        <div className={`h-full ${withDetails ? 'flex items-center' : ''}`}>
          {withDetails && (
            <div className="mb-3 w-full">
              {results.map((result) => (
                <div key={result.choice} className="flex items-center space-x-2 mb-1 font-mono w-full py-0.5">
                  <div className={`rounded-full  inline-block w-[18px] h-[18px] ${choiceColors[result.choice]}`}>
                    {result.choice === 1 &&
                      <div className="text-white w-[14px] h-[14px] mt-[2px] ml-[2px]" >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                    }
                    {result.choice === 2 &&
                      <div className="text-white w-[14px] h-[14px] mt-[2px] ml-[2px]" >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </div>
                    }
                    {result.choice === 3 &&
                      <div className="text-white w-[14px] h-[14px] mt-[2px] ml-[2px]" >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      </div>
                    }
                  </div>
                  <div className="block">{`${_n(Number(result.score) / 10 ** decimals, 'compact')} ${proposal.space.voting_power_symbol}`}</div>
                  <div className="!ml-4 text-white/50 text-[10px] tracking-widest bg-white/10 rounded-lg px-2 py-1">{`${_n(result.progress, 'compact', { maximumFractionDigits: 1 })}%`}</div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-full h-[6px] overflow-hidden" style={{ width: withDetails ? '100%' : `${width}px` }}>
            {results.map((result) => (
              <div
                key={result.choice}
                title={labels[result.choice - 1]}
                className={`choice-bg float-left h-full _${result.choice}`}
                style={{ width: `${result.progress.toFixed(3)}%` }}
              />
            ))}
            <div
              title="Quorum left"
              className="choice-bg _quorum float-left h-full"
              style={{ width: `${(100 * (1 - progress)).toFixed(3)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalResults;
