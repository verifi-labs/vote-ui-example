import React, { FC, useEffect, useMemo, useRef } from 'react';
import { getNetwork } from '../networks';
import { _n, shorten } from '../helpers/utils';
import { NetworkID } from '../types';
import { VotingPower } from '../networks/types';
import AvatarStamp from './AvatarStamp';

interface ModalVotingPowerProps {
  open: boolean;
  networkId: NetworkID;
  votingPowerSymbol: string;
  votingPowers: VotingPower[];
  finalDecimals: number;
  onClose: () => void;
}

const VotingPowerModal: FC<ModalVotingPowerProps> = ({
  open,
  networkId,
  votingPowerSymbol,
  votingPowers,
  finalDecimals,
  onClose,
}) => {
  const loaded = useRef(true);

  const network = useMemo(() => getNetwork(networkId), [networkId]);
  const baseNetwork = useMemo(
    () => (network.baseNetworkId ? getNetwork(network.baseNetworkId) : network),
    [network]
  );

  useEffect(() => {
    loaded.current = true;
  }, [open]);

  return (
    <div>
      {open && (
        <div className="fixed z-10 w-screen h-screen flex items-center justify-center top-0 left-0 backdrop-blur-sm" onClick={() => onClose()}>
          <div className="p-8 bg-black/80 border border-white/30 rounded-xl shadow-pink-400/30 shadow-2xl w-96 max-w-full">
            <div className="border-b border-b-white/50 py-2 mb-4">
              <h3 className="text-sm uppercase tracking-widest opacity-90">Your voting power</h3>
            </div>
            {loaded.current ? (
              votingPowers.map((strategy, i) => (
                <div key={i} className="py-3 border-b last:border-b-0 font-mono w-full">
                  <div className="flex justify-between">
                    <a href={network.helpers.getExplorerUrl(strategy.strategyAddress, 'contract')} target="_blank">
                      {network.constants.STRATEGIES[strategy.strategyAddress]}
                    </a>
                    <div className="">
                      {_n(Number(strategy.value) / 10 ** finalDecimals)} {votingPowerSymbol}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    {strategy.token ? (
                      <a
                        href={baseNetwork.helpers.getExplorerUrl(strategy.token, 'contract')}
                        target="_blank"
                        className="flex items-center text-skin-text"
                      >
                        <div className="mr-2 rounded-sm"> {/* Stamp component, replace with equivalent React component */}
                          {shorten(strategy.token)}             <AvatarStamp id="strategy.token" type="avatar" size={18} className="mr-2 rounded-sm" />

                        </div>
                        <div className="ml-1 -rotate-45">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </a>
                    ) : (
                      <div />
                    )}
                    <div>
                      {_n(Number(strategy.value) / 10 ** strategy.decimals)} {strategy.symbol || 'units'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 block text-center">Loading...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPowerModal;
