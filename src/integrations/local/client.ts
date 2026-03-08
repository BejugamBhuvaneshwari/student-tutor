type QueryResult<T = any> = Promise<{ data: T; error: Error | null }>;
type Filter = { kind: "eq" | "in"; key: string; value: any };
type OrGroup = Array<{ key: string; value: string }>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CURRENT_USER_KEY = "tm_current_user_id";

const parseEqClause = (clause: string) => {
  const match = clause.trim().match(/^([a-zA-Z0-9_]+)\.eq\.(.+)$/);
  if (!match) return null;
  return { key: match[1], value: match[2] };
};

const parseOrExpression = (expr: string): OrGroup[] => {
  if (!expr) return [];
  const grouped = [...expr.matchAll(/and\(([^)]+)\)/g)];
  if (grouped.length > 0) {
    return grouped
      .map((g) =>
        g[1]
          .split(",")
          .map(parseEqClause)
          .filter(Boolean) as Array<{ key: string; value: string }>,
      )
      .filter((group) => group.length > 0);
  }

  return expr
    .split(",")
    .map(parseEqClause)
    .filter(Boolean)
    .map((c) => [c as { key: string; value: string }]);
};

const jsonHeaders = { "Content-Type": "application/json" };

const safeError = (message: string) => new Error(message);

class ApiQueryBuilder {
  private table: string;
  private operation: "select" | "update" = "select";
  private filters: Filter[] = [];
  private orGroups: OrGroup[] = [];
  private limitCount: number | null = null;
  private orderBy: { key: string; ascending: boolean } | null = null;
  private updatePayload: Record<string, any> = {};
  private forceSingle: "none" | "single" | "maybeSingle" = "none";

  constructor(table: string, operation: "select" | "update" = "select") {
    this.table = table;
    this.operation = operation;
  }

  select(_columns?: string) {
    return this;
  }

  eq(key: string, value: any) {
    this.filters.push({ kind: "eq", key, value });
    return this;
  }

  in(key: string, value: any[]) {
    this.filters.push({ kind: "in", key, value });
    return this;
  }

  order(key: string, options?: { ascending?: boolean }) {
    this.orderBy = { key, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  or(expression: string) {
    this.orGroups = parseOrExpression(expression);
    return this;
  }

  update(payload: Record<string, any>) {
    this.operation = "update";
    this.updatePayload = payload;
    return this;
  }

  maybeSingle(): QueryResult<any> {
    this.forceSingle = "maybeSingle";
    return this.execute();
  }

  single(): QueryResult<any> {
    this.forceSingle = "single";
    return this.execute();
  }

  then<TResult1 = { data: any; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): QueryResult<any> {
    try {
      if (this.operation === "update") {
        const response = await fetch(`${API_BASE_URL}/api/db/${this.table}`, {
          method: "PATCH",
          headers: jsonHeaders,
          body: JSON.stringify({
            filters: this.filters,
            values: this.updatePayload,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          return { data: null, error: safeError(text || "Update failed") };
        }
        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];
        if (this.forceSingle === "single") return { data: data[0] || null, error: data[0] ? null : safeError("No rows found") };
        if (this.forceSingle === "maybeSingle") return { data: data[0] || null, error: null };
        return { data, error: null };
      }

      const search = new URLSearchParams();
      if (this.filters.length > 0) search.set("filters", JSON.stringify(this.filters));
      if (this.orGroups.length > 0) search.set("orGroups", JSON.stringify(this.orGroups));
      if (this.orderBy) {
        search.set("orderBy", this.orderBy.key);
        search.set("ascending", String(this.orderBy.ascending));
      }
      if (this.limitCount != null) search.set("limit", String(this.limitCount));
      if (this.forceSingle === "single") search.set("single", "true");
      if (this.forceSingle === "maybeSingle") search.set("maybeSingle", "true");

      const response = await fetch(`${API_BASE_URL}/api/db/${this.table}?${search.toString()}`);
      if (!response.ok) {
        if (this.forceSingle === "maybeSingle" && response.status === 404) return { data: null, error: null };
        const text = await response.text();
        return { data: null, error: safeError(text || "Query failed") };
      }
      const payload = await response.json();
      if (this.forceSingle === "single" || this.forceSingle === "maybeSingle") {
        return { data: payload.data ?? null, error: null };
      }
      return { data: payload.data || [], error: null };
    } catch (error: any) {
      return { data: null, error: error instanceof Error ? error : safeError("Query failed") };
    }
  }
}

const tableApi = (table: string) => ({
  select: (_columns?: string) => new ApiQueryBuilder(table, "select"),
  insert: async (payload: Record<string, any> | Array<Record<string, any>>) => {
    try {
      const rows = Array.isArray(payload) ? payload : [payload];
      const response = await fetch(`${API_BASE_URL}/api/db/${table}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ rows }),
      });
      if (!response.ok) {
        const text = await response.text();
        return { data: null, error: safeError(text || "Insert failed") };
      }
      const json = await response.json();
      return { data: json.data || [], error: null };
    } catch (error: any) {
      return { data: null, error: error instanceof Error ? error : safeError("Insert failed") };
    }
  },
  update: (payload: Record<string, any>) => new ApiQueryBuilder(table, "update").update(payload),
});

const auth = {
  async signUp(params: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          email: params?.email,
          password: params?.password,
          full_name: params?.options?.data?.full_name,
          role: params?.options?.data?.role,
        }),
      });
      const json = await response.json();
      if (!response.ok) return { data: null, error: safeError(json.error || "Signup failed") };

      if (json.user?.id) localStorage.setItem(CURRENT_USER_KEY, json.user.id);
      return { data: { user: json.user }, error: null };
    } catch (error: any) {
      return { data: null, error: error instanceof Error ? error : safeError("Signup failed") };
    }
  },
  async signInWithPassword(params: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          email: params?.email,
          password: params?.password,
        }),
      });
      const json = await response.json();
      if (!response.ok) return { data: null, error: safeError(json.error || "Sign in failed") };
      if (json.user?.id) localStorage.setItem(CURRENT_USER_KEY, json.user.id);
      return { data: { user: json.user }, error: null };
    } catch (error: any) {
      return { data: null, error: error instanceof Error ? error : safeError("Sign in failed") };
    }
  },
  async signOut() {
    localStorage.removeItem(CURRENT_USER_KEY);
    return { error: null };
  },
  async getSession() {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return { data: { session: null }, error: null };
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`);
      if (!response.ok) return { data: { session: null }, error: null };
      const json = await response.json();
      return { data: { session: json.user ? { user: json.user } : null }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.getSession().then(({ data }) => callback("INITIAL_SESSION", data.session));
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

export const supabase = {
  from: (table: string) => tableApi(table),
  auth,
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
  }),
  removeChannel: (_channel: unknown) => {},
};
