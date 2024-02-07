import React, { useState, useMemo, FC } from 'react';
import { _c } from '../helpers/utils';
import { VotingPower } from '../networks/types';
import VerifiButton from './VerifiButton';
import { useAccount } from 'wagmi';
import VotingPowerModal from './VotingPowerModal';
import { NetworkID } from '../types';

interface VotingPowerProps {
  networkId: NetworkID;
  loading: boolean;
  votingPowerSymbol: string;
  votingPowers: VotingPower[];
}

const VotingPowerIndicator: FC<VotingPowerProps> = ({
  networkId,
  loading,
  votingPowerSymbol,
  votingPowers,
}) => {
  const { address } = useAccount()
  const [modalOpen, setModalOpen] = useState(false);

  const votingPower = useMemo(
    () => votingPowers.reduce((acc, b) => acc + BigInt(b.value), BigInt(0)),
    [votingPowers]
  );

  const decimals = useMemo(
    () => Math.max(...votingPowers.map((votingPower) => votingPower.decimals), 0),
    [votingPowers]
  );

  const formattedVotingPower = useMemo(() => {
    const value = _c(votingPower, decimals);

    if (votingPowerSymbol) {
      return `${value} ${votingPowerSymbol}`;
    }

    return value;
  }, [votingPower, decimals, votingPowerSymbol]);

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex">
        <div className="uppercase text-[10px] tracking-widest opacity-80 font-mono">voting power</div>
        {address &&
          (
            <VerifiButton
              loading={loading}
              className={`flex flex-row items-center !rounded-xl !hover:rounded-[0] !w-[30px] px-[12px] !h-[30px] justify-center`}
              onClick={handleModalOpen}
            >
              <span className="text-[10px]">{formattedVotingPower}</span>
            </VerifiButton>
          )}
      </div>

      <VotingPowerModal
        open={modalOpen}
        networkId={networkId}
        votingPowerSymbol={votingPowerSymbol}
        votingPowers={votingPowers}
        finalDecimals={decimals}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default VotingPowerIndicator;
