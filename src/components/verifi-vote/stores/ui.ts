import { useState, useEffect } from 'react';
import { NetworkID, NotificationType } from '../types';



type Notification = {
  id: string;
  type: NotificationType;
  message: string;
};

type PendingTransaction = {
  networkId: NetworkID;
  txId: string;
  createdAt: number;
};

type PendingVotes = Record<string, boolean>;

const PENDING_TRANSACTIONS_TIMEOUT = 10 * 60 * 1000;
const PENDING_TRANSACTIONS_STORAGE_KEY = 'pendingTransactions';

const useUiStore = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [pendingVotes, setPendingVotes] = useState<PendingVotes>({});

  const updateStorage = (pendingTransactions: PendingTransaction[]) => {
    // Implement your storage update logic (lsSet) here
  };

  const toggleSidebar = () => {
    setSidebarOpen((prevSidebarOpen) => !prevSidebarOpen);
  };

  const addNotification = (type: NotificationType, message: string, timeout = 5000) => {
    const id = crypto.randomUUID(); // You need to implement crypto.randomUUID()

    setNotifications((prevNotifications) => [
      ...prevNotifications,
      {
        id,
        type,
        message,
      },
    ]);

    setTimeout(() => dismissNotification(id), timeout);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  const addPendingTransaction = async (txId: string, networkId: NetworkID) => {
    setPendingTransactions((prevPendingTransactions) => [
      ...prevPendingTransactions,
      {
        networkId,
        txId,
        createdAt: Date.now(),
      },
    ]);
    updateStorage(pendingTransactions);

    try {
      // Implement getNetwork and helpers.waitForTransaction
      // const network = getNetwork(networkId);
      // await network.helpers.waitForTransaction(txId);
    } finally {
      setPendingTransactions((prevPendingTransactions) =>
        prevPendingTransactions.filter((el) => el.txId !== txId)
      );
      updateStorage(pendingTransactions);
    }
  };

  const restorePendingTransactions = async () => {
    const persistedTransactions: PendingTransaction[] = JSON.parse(
      localStorage.getItem(PENDING_TRANSACTIONS_STORAGE_KEY) || '[]'
    );

    setPendingTransactions((prevPendingTransactions) =>
      persistedTransactions.filter(
        (tx) => tx.createdAt && tx.createdAt + PENDING_TRANSACTIONS_TIMEOUT > Date.now()
      )
    );

    if (persistedTransactions.length !== pendingTransactions.length) {
      updateStorage(pendingTransactions);
    }

    pendingTransactions.forEach(async ({ networkId, txId }) => {
      try {
        // Implement getNetwork and helpers.waitForTransaction
        // const network = getNetwork(networkId);
        // await network.helpers.waitForTransaction(txId);
      } finally {
        setPendingTransactions((prevPendingTransactions) =>
          prevPendingTransactions.filter((el) => el.txId !== txId)
        );
        updateStorage(pendingTransactions);
      }
    });
  };

  const addPendingVote = (proposalId: string) => {
    setPendingVotes((prevPendingVotes) => ({
      ...prevPendingVotes,
      [proposalId]: true,
    }));
  };

  useEffect(() => {
    restorePendingTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sidebarOpen,
    notifications,
    pendingTransactions,
    pendingVotes,
    toggleSidebar,
    addNotification,
    dismissNotification,
    addPendingTransaction,
    restorePendingTransactions,
    addPendingVote,
  };
};

export default useUiStore;
