// Utility function to generate consistent user identifiers
export async function generateUserIdentifier(): Promise<string> {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;

  const combined = `${userAgent}|${language}|${timezone}|${screenResolution}`;

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `user_${Math.abs(hash).toString(36)}`;
}