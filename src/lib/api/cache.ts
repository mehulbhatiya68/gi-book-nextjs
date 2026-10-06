interface CacheEntry {
  data: any;
  timestamp: number;
}

const DEFAULT_TTL_MS = 30000; // 30 seconds default cache TTL

class ApiCache {
  private cacheMap = new Map<string, CacheEntry>();
  private inflightMap = new Map<string, Promise<any>>();

  // Generate unique key for an API endpoint request
  private getCacheKey(endpoint: string, method: string = "GET", body?: any): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const serializedBody = body ? JSON.stringify(body) : "";
    return `${method.toUpperCase()}:${cleanEndpoint}:${serializedBody}`;
  }

  // Check if a request is safe for caching (read/list operations)
  private isCacheable(method: string = "GET", endpoint: string = ""): boolean {
    const m = method.toUpperCase();
    if (m === "GET") return true;
    if (m === "POST") {
      // List POST endpoints in this project that read data
      const listEndpoints = [
        "/invoices",
        "/parties",
        "/payments",
        "/transactions",
        "/items",
        "/ledgers",
        "/staff",
        "/sites",
        "/projects",
        "/ledger-transactions",
        "/permissions",
        "/hsn-sac-codes",
        "/dashboard",
        "/reports",
        "/business",
        "/settings",
        "/subscription",
      ];
      const nonMutating = !endpoint.includes("/store") && !endpoint.includes("/select") && !endpoint.includes("/adjust-stock") && !endpoint.includes("/status");
      return listEndpoints.some((ep) => endpoint.startsWith(ep)) && nonMutating;
    }
    return false;
  }

  // Execute or return cached/in-flight promise
  async fetchWithCache(
    endpoint: string,
    options: Record<string, any>,
    executor: () => Promise<any>
  ): Promise<any> {
    const method = (options.method || "GET").toUpperCase();
    const isCacheableReq = this.isCacheable(method, endpoint);
    const skipCache = !!options.skipCache || !!options.forceFresh;

    // Mutating request (POST store, PUT, DELETE, PATCH) -> Invalidate related cache
    if (!isCacheableReq) {
      this.invalidateRelated(endpoint);
      return executor();
    }

    const key = this.getCacheKey(endpoint, method, options.body);

    // 1. Return fresh cached data if available and valid
    if (!skipCache && this.cacheMap.has(key)) {
      const entry = this.cacheMap.get(key)!;
      const ttl = typeof options.cacheTtl === "number" ? options.cacheTtl : DEFAULT_TTL_MS;
      if (Date.now() - entry.timestamp < ttl) {
        return entry.data;
      }
      this.cacheMap.delete(key);
    }

    // 2. Return active in-flight promise if duplicate request is currently pending
    if (this.inflightMap.has(key)) {
      return this.inflightMap.get(key)!;
    }

    // 3. Launch new request, track in-flight map & store result in cache
    const promise = executor()
      .then((data) => {
        this.inflightMap.delete(key);
        if (data && typeof data === "object") {
          this.cacheMap.set(key, { data, timestamp: Date.now() });
        }
        return data;
      })
      .catch((err) => {
        this.inflightMap.delete(key);
        throw err;
      });

    this.inflightMap.set(key, promise);
    return promise;
  }

  // Invalidate cache entries matching specific prefix patterns
  invalidate(endpointPrefixes: string | string[]): void {
    const prefixes = Array.isArray(endpointPrefixes) ? endpointPrefixes : [endpointPrefixes];
    for (const key of Array.from(this.cacheMap.keys())) {
      if (prefixes.some((prefix) => key.includes(prefix))) {
        this.cacheMap.delete(key);
      }
    }
  }

  // Automatically invalidate related endpoints when mutations occur
  private invalidateRelated(endpoint: string): void {
    const ep = endpoint.toLowerCase();
    if (ep.includes("invoice")) this.invalidate(["/invoices", "/transactions", "/payments", "/dashboard", "/reports"]);
    if (ep.includes("part") || ep.includes("ledger")) {
      this.invalidate(["/parties", "/ledgers", "/ledger-transactions", "/transactions", "/dashboard", "/reports"]);
    }
    if (ep.includes("item")) this.invalidate(["/items", "/dashboard", "/reports"]);
    if (ep.includes("payment") || ep.includes("transaction")) {
      this.invalidate(["/transactions", "/payments", "/invoices", "/ledgers", "/ledger-transactions", "/dashboard", "/reports"]);
    }
    if (ep.includes("staff")) this.invalidate(["/staff", "/permissions"]);
    if (ep.includes("site") || ep.includes("project")) this.invalidate(["/sites", "/projects", "/dashboard", "/reports"]);
    if (ep.includes("business")) this.invalidate(["/business", "/splash"]);
  }

  // Clear entire cache (on logout or user switch)
  clear(): void {
    this.cacheMap.clear();
    this.inflightMap.clear();
  }
}

export const apiCache = new ApiCache();
