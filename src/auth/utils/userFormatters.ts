export function formatNameFromEmail(email?: string | null): string {
  if (!email) return 'User';
  const prefix = email.split('@')[0] || '';
  if (!prefix) return 'User';

  const parts = prefix
    .replace(/[0-9]+/g, '')
    .split(/[._-]+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    const clean = prefix.replace(/[^a-zA-Z0-9]/g, ' ').trim();
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'User';
  }

  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getUserInitials(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim();
  if (cleanName && cleanName !== 'Usuario' && cleanName !== 'User') {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  }

  if (email) {
    const derived = formatNameFromEmail(email);
    const parts = derived.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    const cleanPrefix = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    if (cleanPrefix.length >= 2) {
      return cleanPrefix.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  return 'AD';
}
