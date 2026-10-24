import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          30 * 1000,    // data fresh for 30s
      gcTime:             5 * 60 * 1000,// keep unused cache for 5min
      retry:              2,            // retry failed requests twice
      retryDelay:         (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,      // don't refetch on tab switch
      refetchInterval:    false,        // disable polling by default
    },
    mutations: {
      retry: 0, // never auto-retry mutations
    },
  },
});

// Query key factory — keeps all keys consistent
export const KEYS = {
  sensors: {
    all:      ()       => ['sensors'],
    list:     (params) => ['sensors', 'list', params],
    detail:   (id)     => ['sensors', id],
    readings: (id, p)  => ['sensors', id, 'readings', p],
    summary:  ()       => ['sensors', 'summary'],
  },
  alerts: {
    all:    ()       => ['alerts'],
    list:   (params) => ['alerts', 'list', params],
    detail: (id)     => ['alerts', id],
  },
  sos: {
    all:    (params) => ['sos', 'list', params],
    detail: (ref)    => ['sos', ref],
  },
  operations: {
    all:    (params) => ['operations', 'list', params],
    detail: (id)     => ['operations', id],
  },
  teams: {
    all:    (params) => ['teams', 'list', params],
    detail: (id)     => ['teams', id],
  },
  camps: {
    all:    (params) => ['camps', 'list', params],
    detail: (id)     => ['camps', id],
  },
  drones: {
    all:    ()       => ['drones'],
    detail: (id)     => ['drones', id],
  },
  prediction: {
    node:   (id, p)  => ['prediction', id, p],
    all:    (p)      => ['prediction', 'all', p],
  },
  auth: {
    me: () => ['auth', 'me'],
  },
};
