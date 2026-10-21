import useDataStore from './useDataStore';

/**
 * Legacy sensor store — now delegates to the central useDataStore.
 * Kept for backwards compatibility; prefer useDataStore for new code.
 */
const useSensorStore = (selector) => {
  const defaultSelector = (s) => ({
    nodes:            s.nodes,
    lastUpdated:      Date.now(),
    isConnected:      true,
    simulationMode:   false,
    setNodes:         () => {},           // no-op, managed by useDataStore
    updateNode:       s.updateNode,
    setConnected:     () => {},
    toggleSimulation: () => {},
    getNodeById:      s.getNodeById,
  });

  return useDataStore(selector || defaultSelector);
};

export default useSensorStore;
