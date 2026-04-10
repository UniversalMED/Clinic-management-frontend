export const queryKeys = {
  patients: {
    all: ['patients'] as const,
    list: (params: object) => ['patients', 'list', params] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: (params: object) => ['visits', 'list', params] as const,
    detail: (id: string) => ['visits', 'detail', id] as const,
  },
  consultations: {
    all: ['consultations'] as const,
    list: (params: object) => ['consultations', 'list', params] as const,
    detail: (id: string) => ['consultations', 'detail', id] as const,
  },
  prescriptions: {
    all: ['prescriptions'] as const,
    list: (params: object) => ['prescriptions', 'list', params] as const,
  },
  queue: {
    all: ['queue'] as const,
    list: (params: object) => ['queue', 'list', params] as const,
    detail: (id: string) => ['queue', 'detail', id] as const,
    history: (id: string) => ['queue', 'history', id] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    list: (params: object) => ['appointments', 'list', params] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
  },
  labTests: {
    all: ['lab', 'tests'] as const,
    list: (params: object) => ['lab', 'tests', 'list', params] as const,
    detail: (id: string) => ['lab', 'tests', 'detail', id] as const,
  },
  labOrders: {
    all: ['lab', 'orders'] as const,
    list: (params: object) => ['lab', 'orders', 'list', params] as const,
    detail: (id: string) => ['lab', 'orders', 'detail', id] as const,
  },
  labResults: {
    all: ['lab', 'results'] as const,
    list: (params: object) => ['lab', 'results', 'list', params] as const,
    detail: (id: string) => ['lab', 'results', 'detail', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (params: object) => ['invoices', 'list', params] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  payments: {
    all: ['payments'] as const,
    list: (invoiceId: string, params: object) =>
      ['payments', 'list', invoiceId, params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params: object) => ['notifications', 'list', params] as const,
  },
  audit: {
    all: ['audit'] as const,
    logs: (params: object) => ['audit', 'logs', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: object) => ['users', 'list', params] as const,
    me: () => ['users', 'me'] as const,
  },
} as const
