export const ROLES = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  FACULTY: 'Faculty',
  REVIEW_COMMITTEE: 'ReviewCommittee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_IDS: Record<number, Role> = {
  1: ROLES.ADMIN,
  2: ROLES.STAFF,
  3: ROLES.FACULTY,
  4: ROLES.REVIEW_COMMITTEE,
};
