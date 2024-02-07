import { useCallback, useEffect, useRef, useState } from "react";
import { NetworkID, Space } from "../types";

type NetworkRecord = {
  spaces: Record<string, Space>;
  spacesIdsList: string[];
  hasMoreSpaces: boolean;
};
import { enabledNetworks, getNetwork } from '../networks';

const useSpaceStore = (spaceId: string, networkId: NetworkID) => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);

  const networksMap = useRef(
    Object.fromEntries(
      enabledNetworks.map(network => [
        network,
        {
          spaces: {},
          spacesIdsList: [],
          hasMoreSpaces: true
        } as NetworkRecord
      ])
    )
  );

  const fetchSpace = useCallback(async function (_id: string, _network: NetworkID) {
    try {
      setIsLoading(true);

      const network = getNetwork(_network);
      const _space = await network.api.loadSpace(_id);

      setSpace(_space);

      if (!_space) return;
      networksMap.current[_network].spaces = {
        ...networksMap.current[_network].spaces,
        [_id]: _space
      };

    } catch (error) {
      setError(error as Error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSpace, setError]);


  useEffect(() => {
    if (space) return;
    fetchSpace(spaceId, networkId);
  }, [isLoading, fetchSpace, spaceId, networkId, space]);

  return {
    space,
    isLoading,
    error
  }
}

export default useSpaceStore