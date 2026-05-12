/** Full URL to pre-fill the join form with this group's invite token. */
export function buildGroupJoinUrl(inviteToken: string): string {
  if (typeof window === "undefined") return "";
  const { origin } = window.location;
  return `${origin}/groups?invite=${encodeURIComponent(inviteToken)}`;
}
