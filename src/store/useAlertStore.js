import { create } from 'zustand';

// Kept for backward compatibility only.
// Header now reads alert count directly from useDataStore.
const useAlertStore = create(() => ({
  activeCount: 0,
}));

export default useAlertStore;
