import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      role:            null,
      isAuthenticated: false,

      // User portal profile fields
      userProfile: {
        name:           '',
        phone:          '',
        homeAddress:    '',
        homeLat:        null,
        homeLng:        null,
        familyCount:    1,
        notifyAlerts:   true,
        notifySMS:      false,
        language:       'en',
      },

      setAuth: (user, token, role) =>
        set({ user, token, role, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, token: null, role: null, isAuthenticated: false }),

      updateUserProfile: (updates) =>
        set((s) => ({
          userProfile: { ...s.userProfile, ...updates },
        })),

      // Helper: is this an admin-level role?
      isAdminRole: () => {
        const role = get().role;
        return ['admin', 'coordinator', 'operator', 'field'].includes(role);
      },

      // Helper: is this a citizen-level role?
      isUserRole: () => {
        const role = get().role;
        return ['user', 'citizen', 'public'].includes(role);
      },
    }),
    { name: 'idms-auth' }
  )
);

export default useAuthStore;
