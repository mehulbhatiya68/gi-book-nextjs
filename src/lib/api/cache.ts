interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Configurable endpoint-specific TTLs (in milliseconds)
const TTL_TIERS: Array<{ match: (ep: string) => boolean; ttl: number }> = [
  // 10 minutes: Static / configuration endpoints
  {
    match: (ep) => ep.includes("/permissions") || ep.includes("/hsn-sac-codes") || ep.includes("/settings") || ep.includes("/profile"),
    ttl: 10 * 60 * 1000,
  },
  // 5 minutes: Relatively stable business metadata
  {
    match: (ep) => ep.includes("/staff") || ep.includes("/sites") || ep.includes("/projects") || ep.includes("/business") || ep.includes("/subscription"),
    ttl: 5 * 60 * 1000,
  },
  // 1 minute: Real-time reports
  {
    match: (ep) => ep.includes("/reports"),
    ttl: 60 * 1000,
  },
  // 2 minutes (Default): Invoices, parties, items, ledgers, payments, transactions, dashboard
  {
    match: () => true,
    ttl: 2 * 60 * 1000,
  },
];

class ApiCache {
  private cacheMap = new Map<string, CacheEntry>();
  private inflightMap = new Map<string, Promise<any>>();
  private lastInvalidatedMap = new Map<string, number>();
  private currentScope = { bizId: "", userId: "" };

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedBiz = localStorage.getItem("gi_active_business_id");
        const savedUser = localStorage.getItem("gi_user_id");
        if (savedBiz || savedUser) {
          this.currentScope = { bizId: savedBiz || "", userId: savedUser || "" };
        }
      } catch (_) {}
    }
  }

  // Set the active business and user scope for strict cache isolation
  setScope(bizId?: string | number | null, userId?: string | number | null): void {
    const nextBiz = bizId ? String(bizId) : "";
    const nextUser = userId ? String(userId) : "";
    if (this.currentScope.bizId !== nextBiz || this.currentScope.userId !== nextUser) {
      this.clear();
      this.currentScope = { bizId: nextBiz, userId: nextUser };
      if (typeof window !== "undefined") {
        try {
          if (nextBiz) localStorage.setItem("gi_active_business_id", nextBiz);
          else localStorage.removeItem("gi_active_business_id");
          if (nextUser) localStorage.setItem("gi_user_id", nextUser);
          else localStorage.removeItem("gi_user_id");
        } catch (_) {}
      }
    }
  }

  getScope(): { bizId: string; userId: string } {
    return this.currentScope;
  }

  // Resolve TTL for a given endpoint
  private resolveTtl(endpoint: string, customTtl?: number): number {
    if (typeof customTtl === "number" && customTtl >= 0) return customTtl;
    const cleanEndpoint = endpoint.toLowerCase();
    for (const tier of TTL_TIERS) {
      if (tier.match(cleanEndpoint)) return tier.ttl;
    }
    return 2 * 60 * 1000;
  }

  // Generate unique deterministic key for an API endpoint request scoped by business
  getCacheKey(endpoint: string, method: string = "GET", body?: any): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const scopePrefix = this.currentScope.bizId ? `b:${this.currentScope.bizId}:` : "";
    let serializedBody = "";
    if (body) {
      if (typeof body === "string") {
        serializedBody = body.trim();
      } else if (typeof body === "object") {
        try {
          const keys = Object.keys(body).filter((k) => body[k] !== undefined).sort();
          if (keys.length > 0) {
            const sortedObj: Record<string, any> = {};
            for (const k of keys) {
              sortedObj[k] = body[k];
            }
            serializedBody = JSON.stringify(sortedObj);
          }
        } catch (_) {
          serializedBody = JSON.stringify(body);
        }
      }
    }
    return `${scopePrefix}${method.toUpperCase()}:${cleanEndpoint}:${serializedBody}`;
  }

  // Check if a request is safe for caching (read/list operations)
  isCacheable(method: string = "GET", endpoint: string = ""): boolean {
    const m = method.toUpperCase();
    if (m === "GET") return true;
    if (m === "POST") {
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
      const nonMutating =
        !endpoint.includes("/store") &&
        !endpoint.includes("/select") &&
        !endpoint.includes("/adjust-stock") &&
        !endpoint.includes("/status") &&
        !endpoint.includes("/delete") &&
        !endpoint.includes("/destroy") &&
        !endpoint.includes("/update");
      return listEndpoints.some((ep) => endpoint.startsWith(ep)) && nonMutating;
    }
    return false;
  }

  // Synchronously get valid cached data if unexpired
  get<T = any>(endpoint: string, method: string = "GET", body?: any): T | null {
    const key = this.getCacheKey(endpoint, method, body);
    const entry = this.cacheMap.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp < entry.ttl) {
      return entry.data as T;
    }
    this.cacheMap.delete(key);
    return null;
  }

  // Synchronously peek cached data even if stale (for instant initial state)
  peek<T = any>(endpoint: string, method: string = "GET", body?: any): T | null {
    const key = this.getCacheKey(endpoint, method, body);
    const entry = this.cacheMap.get(key);
    if (entry) return entry.data as T;

    // Fallback: If body was omitted or empty, check if ANY cached response exists for this endpoint & method
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const scopePrefix = this.currentScope.bizId ? `b:${this.currentScope.bizId}:` : "";
    const prefix = `${scopePrefix}${method.toUpperCase()}:${cleanEndpoint}:`;
    for (const [k, v] of this.cacheMap.entries()) {
      if (k.startsWith(prefix) && v?.data) {
        return v.data as T;
      }
    }
    return null;
  }

  // Check if a valid, unexpired entry exists in cache
  hasValid(endpoint: string, method: string = "GET", body?: any): boolean {
    return this.get(endpoint, method, body) !== null;
  }

  // Manually put data into cache
  set(endpoint: string, data: any, method: string = "GET", body?: any, customTtl?: number): void {
    if (!data) return;
    const key = this.getCacheKey(endpoint, method, body);
    const ttl = this.resolveTtl(endpoint, customTtl);
    this.cacheMap.set(key, { data, timestamp: Date.now(), ttl });
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
    const ttl = this.resolveTtl(endpoint, options.cacheTtl);

    // 1. Return fresh cached data if available and valid
    if (!skipCache && this.cacheMap.has(key)) {
      const entry = this.cacheMap.get(key)!;
      if (Date.now() - entry.timestamp < (typeof options.cacheTtl === "number" ? options.cacheTtl : entry.ttl)) {
        return entry.data;
      }
      this.cacheMap.delete(key);
    }

    // 2. Return active in-flight promise if duplicate request is currently pending
    if (this.inflightMap.has(key)) {
      return this.inflightMap.get(key)!;
    }

    // 3. Launch new request, track in-flight map & store result in cache
    const requestTimestamp = Date.now();
    const promise = executor()
      .then((data) => {
        this.inflightMap.delete(key);
        // Stale response guard: check if this endpoint was invalidated after this request started
        let wasInvalidated = false;
        const ep = endpoint.toLowerCase();
        for (const [prefix, invTime] of this.lastInvalidatedMap.entries()) {
          if (ep.includes(prefix) && invTime >= requestTimestamp) {
            wasInvalidated = true;
            break;
          }
        }
        if (!wasInvalidated && data && typeof data === "object") {
          this.cacheMap.set(key, { data, timestamp: Date.now(), ttl });
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
    const now = Date.now();
    const prefixes = Array.isArray(endpointPrefixes) ? endpointPrefixes : [endpointPrefixes];
    for (const prefix of prefixes) {
      this.lastInvalidatedMap.set(prefix.toLowerCase(), now);
    }
    for (const key of Array.from(this.cacheMap.keys())) {
      if (prefixes.some((prefix) => key.includes(prefix))) {
        this.cacheMap.delete(key);
      }
    }
  }

  // Automatically invalidate related endpoints when mutations occur
  invalidateRelated(endpoint: string): void {
    const ep = endpoint.toLowerCase();
    if (ep.includes("invoice")) {
      this.invalidate(["/invoices", "/transactions", "/payments", "/dashboard", "/reports", "/ledgers", "/parties", "/subscription"]);
    }
    if (ep.includes("part") || ep.includes("ledger")) {
      this.invalidate(["/parties", "/ledgers", "/ledger-transactions", "/transactions", "/payments", "/dashboard", "/reports", "/invoices"]);
    }
    if (ep.includes("item")) {
      this.invalidate(["/items", "/dashboard", "/reports"]);
    }
    if (ep.includes("payment") || ep.includes("transaction")) {
      this.invalidate(["/transactions", "/payments", "/invoices", "/ledgers", "/ledger-transactions", "/dashboard", "/reports", "/parties"]);
    }
    if (ep.includes("staff")) {
      this.invalidate(["/staff", "/permissions"]);
    }
    if (ep.includes("site") || ep.includes("project")) {
      this.invalidate(["/sites", "/projects", "/dashboard", "/reports"]);
    }
    if (ep.includes("business")) {
      this.invalidate(["/business", "/splash", "/dashboard"]);
    }
    if (ep.includes("subscription")) {
      this.invalidate(["/subscription"]);
    }
  }

  // Clear entire cache (on logout or user switch)
  clear(): void {
    this.cacheMap.clear();
    this.inflightMap.clear();
    this.lastInvalidatedMap.clear();
  }
}

export const apiCache = new ApiCache();
