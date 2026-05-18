export type GroupDto = {
  id: string;
  name: string;
  inviteToken: string;
  createdById: string;
  defaultCurrency: number;
};

/** GET /api/groups/pending-invites */
export type PendingGroupInviteDto = {
  notificationId: string;
  groupId: string;
  groupName: string;
  inviteToken: string;
  invitedByUserId: string;
  invitedByName: string;
  createdAt: string;
};

/** From GET /api/groups/{groupId} — roster with display names. */
export type GroupMemberSummaryDto = {
  userId: string;
  displayName: string;
  joinedAt: string;
  isCreator: boolean;
  /** Public URL from API when user has a profile photo. */
  profilePictureUrl?: string | null;
};

export type GroupDetailDto = {
  id: string;
  name: string;
  inviteToken: string;
  createdById: string;
  defaultCurrency: number;
  members: GroupMemberSummaryDto[];
};

/** GET /api/dashboard/group-balances */
export type DashboardGroupBalanceDto = {
  groupId: string;
  groupName: string;
  /** Enum string from API, e.g. `"EGP"`. */
  currency: string | number;
  youOwe: number;
  youAreOwed: number;
};

/** GET /api/dashboard/recent-activity */
export type DashboardActivityItemDto = {
  kind: "transaction" | "settlement";
  id: string;
  groupId: string;
  groupName: string;
  createdAt: string;
  currency: string | number;
  amount: number;
  description: string | null;
  actorUserId: string | null;
  actorName: string | null;
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  note: string | null;
};

/** From GET /api/transactions/group/{groupId}/debts — one row per group member. */
export type GroupMemberBalanceDto = {
  userId: string;
  totalOwed: number;
  settledAmount: number;
  remainingOwed: number;
};

export type TransactionDto = {
  id: string;
  groupId: string;
  paidByUserId: string;
  /** Display name of payer (`AppUser.Name`); use when not the current user. */
  paidByDisplayName: string;
  totalAmount: number;
  currency: number;
  category: number;
  description: string | null;
  createdAt: string;
  members: { userId: string; amountOwed: number }[];
};

/** From GET /api/transactions/{id} — per-member balances including settlements. */
export type TransactionDetailDto = {
  id: string;
  groupId: string;
  paidByUserId: string;
  totalAmount: number;
  currency: number | string;
  category: number;
  description: string | null;
  createdAt: string;
  members: {
    userId: string;
    totalOwed: number;
    settledAmount: number;
    remainingOwed: number;
  }[];
};

export type SettlementDto = {
  id: string;
  groupId: string;
  payerUserId: string;
  payeeUserId: string;
  amount: number;
  /** Serialized as enum string (e.g. `"USD"`) from the API. */
  currency: string | number;
  createdAt: string;
  note: string | null;
  allocations: {
    transactionId: string;
    debtorUserId: string;
    allocatedAmount: number;
  }[];
};

/** GET /api/friends */
export type FriendDto = {
  userId: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
};

/** GET /api/friends/pending */
export type PendingFriendRequestDto = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  profilePictureUrl: string | null;
};

/** GET /api/users/search?q= */
export type UserProfileSearchDto = {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
};
