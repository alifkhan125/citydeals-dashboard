export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    overview: ["dashboard", "overview"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  staff: {
    all: ["admin", "staff"] as const,
  },
  roles: {
    all: ["admin", "roles"] as const,
  },
  businesses: {
    all: ["businesses"] as const,
  },
  geofences: {
    all: ["geofences"] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  areas: {
    all: ["areas"] as const,
  },
  coupons: {
    all: ["coupons"] as const,
  },
  redemptions: {
    all: ["redemptions"] as const,
    list: (areaId: string) => ["redemptions", areaId] as const,
  },
  savedActivity: {
    all: ["saved-activity"] as const,
    list: (areaId: string) => ["saved-activity", areaId] as const,
  },
  shareAnalytics: {
    all: ["share-analytics"] as const,
  },
  notifications: {
    history: ["notifications", "history"] as const,
  },
  support: {
    tickets: ["support", "tickets"] as const,
  },
  legal: {
    pages: ["legal", "pages"] as const,
  },
};
