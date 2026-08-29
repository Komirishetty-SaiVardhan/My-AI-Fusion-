export class SSRFGuard {
  private blockedHostnames = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254", // Cloud metadata IP
    "metadata.google.internal",
    "instance-data",
  ]);

  /**
   * Validates a URL to prevent SSRF (Server-Side Request Forgery) attacks.
   */
  validateUrl(rawUrl: string): { isSafe: boolean; reason?: string } {
    try {
      const parsed = new URL(rawUrl);

      // 1. Only allow HTTP and HTTPS
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return {
          isSafe: false,
          reason: `Protocol '${parsed.protocol}' is forbidden. Only HTTP/HTTPS are allowed.`,
        };
      }

      const hostname = parsed.hostname.toLowerCase();

      // 2. Check blacklist hostnames
      if (this.blockedHostnames.has(hostname)) {
        return {
          isSafe: false,
          reason: `Access to internal host '${hostname}' is strictly blocked.`,
        };
      }

      // 3. Check private IP ranges
      if (this.isPrivateIp(hostname)) {
        return {
          isSafe: false,
          reason: `Access to private subnet IP '${hostname}' is strictly blocked.`,
        };
      }

      return { isSafe: true };
    } catch {
      return { isSafe: false, reason: "Malformed URL format." };
    }
  }

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local & cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;

    return false;
  }
}

export const ssrfGuard = new SSRFGuard();
