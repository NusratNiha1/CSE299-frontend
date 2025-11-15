export const ui = {
  // Card containers
  cardContainer: 'rounded-3xl border border-glassBorder bg-transparent',
  cardContent: 'p-md',

  // Typography
  title: 'text-text font-bold',
  subtitle: 'text-textSecondary',
  subtle: 'text-textSecondary',

  // Icons and badges
  actionIcon: 'w-16 h-16 rounded-full justify-center items-center relative',
  notifBadge: 'absolute right-1 top-1 bg-error rounded-full justify-center items-center',
};

export type UIKeys = keyof typeof ui;
