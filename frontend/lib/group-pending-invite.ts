const PENDING_INVITE_KEY = "cayeshni_pending_group_invite";

/**
 * Stores a group invite token to be processed after authentication.
 * Useful when user opens an invite link but is not yet logged in.
 */
export function storePendingGroupInvite(inviteToken: string): void {
  try {
    if (inviteToken && inviteToken.trim()) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteToken.trim());
    }
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Retrieves the pending group invite token without clearing it.
 */
export function peekPendingGroupInvite(): string | null {
  try {
    return sessionStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

/**
 * Retrieves and clears the pending group invite token.
 */
export function consumePendingGroupInvite(): string | null {
  try {
    const token = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (token) {
      sessionStorage.removeItem(PENDING_INVITE_KEY);
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Clears any pending group invite.
 */
export function clearPendingGroupInvite(): void {
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    /* ignore storage errors */
  }
}
