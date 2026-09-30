import { UAParser } from 'ua-parser-js';

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  browser: string;
  operatingSystem: string;
}

export function parseUserAgent(userAgentString: string): { browser: string; operatingSystem: string } {
  const parser = new UAParser(userAgentString);
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();

  return {
    browser: browserInfo.name
      ? `${browserInfo.name} ${browserInfo.version || ''}`.trim()
      : 'Unknown',
    operatingSystem: osInfo.name
      ? `${osInfo.name} ${osInfo.version || ''}`.trim()
      : 'Unknown',
  };
}

export function getClientInfo(request: Request): ClientInfo {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const { browser, operatingSystem } = parseUserAgent(userAgent);

  // Get IP address from various headers (Vercel, proxies, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || 'Unknown';

  return {
    ipAddress,
    userAgent,
    browser,
    operatingSystem,
  };
}

export function generateSecureToken(): string {
  // Generate a cryptographically random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}
