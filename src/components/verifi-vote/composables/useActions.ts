import { getReadWriteNetwork } from '../networks';
import { registerTransaction } from '../helpers/mana';
import type {
  Proposal,  
  Choice,
  NetworkID
} from '../types';
import type { Connector } from '../networks/types';
import { getAccount, getNetwork, getWalletClient } from 'wagmi/actions';
import useUiStore from '../stores/ui';


export function useActions() {
  const uiStore = useUiStore();
  
  function wrapWithErrors<T extends any[], U>(fn: (...args: T) => U) {
    return async (...args: T): Promise<U> => {
      try {
        return await fn(...args);
      } catch (e: any) {
        const isUserAbortError =
          e.code === 4001 ||
          e.message === 'User rejected the request.' ||
          e.code === 'ACTION_REJECTED';

        if (!isUserAbortError) {
          uiStore.addNotification('error', 'Something went wrong. Please try again later.');
        }

        throw e;
      }
    };
  }

  function handleSafeEnvelope(envelope: any) {
    if (envelope !== null) return false;

    uiStore.addNotification('success', 'Transaction set up.');
    return true;
  }

  async function handleCommitEnvelope(envelope: any, networkId: NetworkID) {
    // TODO: it should work with WalletConnect, should be done before L1 transaction is broadcasted
    const network = getReadWriteNetwork(networkId);

    if (envelope?.signatureData?.commitHash && network.baseNetworkId) {
      await registerTransaction(network.chainId, {
        type: envelope.signatureData.primaryType,
        hash: envelope.signatureData.commitHash,
        payload: envelope.data
      });

      if (envelope.signatureData.commitTxId) {
        uiStore.addPendingTransaction(envelope.signatureData.commitTxId, network.baseNetworkId);
      }

      uiStore.addNotification(
        'success',
        'Transaction set up. It will be processed once received on L2 network automatically.'
      );

      return true;
    }

    return false;
  }

  async function wrapPromise(networkId: NetworkID, promise: Promise<any>) {
    const network = getReadWriteNetwork(networkId);

    const envelope = await promise;

    if (handleSafeEnvelope(envelope)) return;
    if (await handleCommitEnvelope(envelope, networkId)) return;

    // TODO: unify send/soc to both return txHash under same property
    if (envelope.signatureData || envelope.sig) {
      const receipt = await network.actions.send(envelope);
      
      uiStore.addPendingTransaction(receipt.transaction_hash || receipt.hash, networkId);
    } else {
      uiStore.addPendingTransaction(envelope.transaction_hash || envelope.hash, networkId);
    }
  }


  async function vote(proposal: Proposal, choice: Choice) {
    // if (!web3.value.account) return await forceLogin();

    const network = getReadWriteNetwork(proposal.network);
    const walletClient = await getWalletClient({chainId: network.chainId})
    const { connector, address } = await getAccount()
    
    await wrapPromise(
      proposal.network,
      network.actions.vote(
        walletClient,
        connector?.id as Connector,
        address as string,
        proposal,
        choice
      )
    );

    uiStore.addPendingVote(proposal.id);   
  }

  return { 
    vote: wrapWithErrors(vote),  
  };
}
