// ==============================================
// Mock Supabase Client
// ==============================================
//
// Emulates the Supabase JS client fluent API so every page in
// the app can render with dummy data and no real Supabase project.
//
// Typing strategy: `data` is typed as `any` (the minimal unavoidable use)
// because the real Supabase client returns broadly-typed data that pages
// access with `.map()`, `.length`, `.role`, `[0]`, etc. without explicit
// casts. Using `unknown` would require changes to every page file.

import { getTableData, MOCK_USERS } from "./data";

// ----- Internal record type used only inside this module -----

type Rec = Record<string, unknown>;

// ----- Public result type (matches what pages destructure) -----
//
// The real Supabase client returns broadly typed data that pages
// access with .map(), .length, .role, [0], .reduce(), and `as X`.
// We use `any` for maximum compatibility with page-level code.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseData = any;

interface QueryResult {
  data: SupabaseData;
  error: null | { message: string };
  count?: number;
}

// ----- Misc types -----

interface SelectOptions {
  count?: "exact";
  head?: boolean;
}

interface OrderOptions {
  ascending?: boolean;
}

interface MockChannel {
  on(event: string, config: unknown, callback: unknown): MockChannel;
  subscribe(): MockChannel;
}

interface MockSubscription {
  unsubscribe: () => void;
}

// ----- localStorage + cookie helpers (SSR-safe) -----
//
// The mock auth persists the active user_id in two places:
//   - localStorage (so client navigations remain logged-in)
//   - a cookie (so Server Components can read the user during SSR)

export const MOCK_AUTH_COOKIE = "mock_auth_user_id";
const AUTH_KEY = MOCK_AUTH_COOKIE;

function setBrowserCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
}

function clearBrowserCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_KEY);
  } catch {
    return null;
  }
}

function setStoredUserId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_KEY, id);
    setBrowserCookie(AUTH_KEY, id);
  } catch {
    /* SSR / security policy */
  }
}

function removeStoredUserId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_KEY);
    clearBrowserCookie(AUTH_KEY);
  } catch {
    /* SSR / security policy */
  }
}

// ----- UUID helper -----

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----- Join resolution -----

interface JoinSpec {
  alias: string;
  table: string;
  fk: string;
  fields: string;
}

interface ParsedSelect {
  baseColumns: string;
  joins: JoinSpec[];
}

function parseSelect(selectStr: string): ParsedSelect {
  const joins: JoinSpec[] = [];
  const joinRegex = /(\w+):(\w+)!(\w+)\(([^)]*)\)/g;
  let cleaned = selectStr;
  let m = joinRegex.exec(selectStr);
  while (m !== null) {
    joins.push({ alias: m[1], table: m[2], fk: m[3], fields: m[4] });
    cleaned = cleaned.replace(m[0], "");
    m = joinRegex.exec(selectStr);
  }
  cleaned = cleaned
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(", ");
  return { baseColumns: cleaned || "*", joins };
}

function pickColumns(row: Rec, baseColumns: string): Rec {
  if (baseColumns === "*") return { ...row };
  const fields = baseColumns.split(",").map((f) => f.trim());
  const out: Rec = {};
  for (const f of fields) {
    if (f in row) out[f] = row[f];
  }
  return out;
}

function resolveJoin(
  row: Rec,
  _alias: string,
  foreignTable: string,
  fkColumn: string,
  selectFields: string
): unknown {
  const fkValue = row[fkColumn];
  if (fkValue === undefined || fkValue === null) return null;

  const foreignData = getTableData(foreignTable);
  let found: Rec | undefined;

  if (foreignTable === "users") {
    found = foreignData.find((r) => r.id === fkValue);
  } else if (
    foreignTable === "company_profiles" ||
    foreignTable === "advisor_profiles"
  ) {
    found = foreignData.find((r) => r.user_id === fkValue);
  } else if (foreignTable === "meeting_requests") {
    found = foreignData.find((r) => r.id === fkValue);
  } else {
    found =
      foreignData.find((r) => r.id === fkValue) ??
      foreignData.find((r) => r.user_id === fkValue);
  }

  if (!found) return null;

  if (selectFields.trim() === "*") return { ...found };

  const fields = selectFields.split(",").map((f) => f.trim());
  const out: Rec = {};
  for (const f of fields) {
    if (f in found) out[f] = found[f];
  }
  return out;
}

// ----- MockQueryBuilder -----

type FilterFn = (row: Rec) => boolean;

class MockQueryBuilder implements PromiseLike<QueryResult> {
  private tableName: string;
  private filters: FilterFn[] = [];
  private selectStr = "*";
  private selectOpts: SelectOptions | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private isSingle = false;
  private limitN: number | null = null;
  private doInsert = false;
  private doUpdate = false;
  private mutData: Rec | null = null;
  private chainedSelect = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // ----- SELECT -----

  select(columns?: string, options?: SelectOptions): this {
    if (this.doInsert || this.doUpdate) {
      this.chainedSelect = true;
      return this;
    }
    this.selectStr = columns ?? "*";
    this.selectOpts = options ?? null;
    return this;
  }

  // ----- FILTERS -----

  eq(column: string, value: unknown): this {
    this.filters.push((row) => {
      const v = row[column];
      if (typeof value === "boolean") return v === value;
      if (value === "true") return v === true || v === "true";
      if (value === "false") return v === false || v === "false";
      return v === value;
    });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  contains(column: string, values: unknown[]): this {
    this.filters.push((row) => {
      const arr = row[column];
      if (!Array.isArray(arr)) return false;
      return values.every((v) => arr.includes(v));
    });
    return this;
  }

  ilike(column: string, pattern: string): this {
    const search = pattern.replace(/%/g, "").toLowerCase();
    this.filters.push((row) => {
      const v = row[column];
      if (typeof v !== "string") return false;
      return v.toLowerCase().includes(search);
    });
    return this;
  }

  or(expression: string): this {
    const parts = expression.split(",").map((p) => p.trim());
    const orFns: FilterFn[] = [];
    for (const part of parts) {
      const segs = part.split(".");
      if (segs.length >= 3) {
        const col = segs[0];
        const op = segs[1];
        const val = segs.slice(2).join(".");
        if (op === "ilike") {
          const s = val.replace(/%/g, "").toLowerCase();
          orFns.push((row) => {
            const v = row[col];
            return typeof v === "string" && v.toLowerCase().includes(s);
          });
        } else if (op === "eq") {
          orFns.push((row) => String(row[col]) === val);
        }
      }
    }
    if (orFns.length > 0) {
      this.filters.push((row) => orFns.some((fn) => fn(row)));
    }
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push((row) => {
      const v = row[column];
      if (typeof v === "number" && typeof value === "number") return v >= value;
      if (typeof v === "string" && typeof value === "string") return v >= value;
      return false;
    });
    return this;
  }

  // ----- MODIFIERS -----

  order(column: string, options?: OrderOptions): this {
    this.orderCol = column;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  limit(count: number): this {
    this.limitN = count;
    return this;
  }

  // ----- MUTATIONS -----

  insert(data: Rec | Rec[]): this {
    this.doInsert = true;
    this.mutData = Array.isArray(data) ? (data[0] ?? {}) : data;
    return this;
  }

  update(data: Rec): this {
    this.doUpdate = true;
    this.mutData = data;
    return this;
  }

  delete(): this {
    return this;
  }

  // ----- Execute -----

  private execute(): QueryResult {
    // --- Mutations ---
    if (this.doInsert) {
      const inserted: Rec = {
        id: generateUUID(),
        ...this.mutData,
        created_at: new Date().toISOString(),
      };
      if (this.chainedSelect && this.isSingle) {
        return { data: inserted, error: null };
      }
      if (this.chainedSelect) {
        return { data: [inserted], error: null };
      }
      return { data: inserted, error: null };
    }

    if (this.doUpdate) {
      return { data: this.mutData, error: null };
    }

    // --- Queries ---
    let rows: Rec[] = getTableData(this.tableName).map((r) => ({ ...r }));

    for (const fn of this.filters) {
      rows = rows.filter(fn);
    }

    // Count-only
    if (this.selectOpts?.head && this.selectOpts.count === "exact") {
      return { data: null, error: null, count: rows.length };
    }

    const parsed = parseSelect(this.selectStr);

    let results: Rec[] = rows.map((row) => {
      const picked = pickColumns(row, parsed.baseColumns);
      for (const j of parsed.joins) {
        picked[j.alias] = resolveJoin(row, j.alias, j.table, j.fk, j.fields);
      }
      return picked;
    });

    // Sort
    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.orderAsc;
      results.sort((a, b) => {
        const va = a[col];
        const vb = b[col];
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const cmp = va < vb ? -1 : 1;
        return asc ? cmp : -cmp;
      });
    }

    // Limit
    if (this.limitN !== null) {
      results = results.slice(0, this.limitN);
    }

    // Single
    if (this.isSingle) {
      return { data: results[0] ?? null, error: null };
    }

    return { data: results, error: null };
  }

  // ----- PromiseLike -----

  then<T1 = QueryResult, T2 = never>(
    onfulfilled?: ((v: QueryResult) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

// ----- Mock Auth -----

interface AuthUser {
  id: string;
  email: string;
}

interface AuthResult {
  data: { user: AuthUser | null };
  error: { message: string } | null;
}

function createMockAuth(opts?: { getCookie?: (name: string) => string | undefined }) {
  return {
    async signInWithPassword({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResult> {
      if (password.length < 8) {
        return {
          data: { user: null },
          error: { message: "Invalid password" },
        };
      }
      const found = MOCK_USERS.find((u) => u.email === email);
      if (!found) {
        return {
          data: { user: null },
          error: { message: "Invalid login credentials" },
        };
      }
      setStoredUserId(found.id);
      return {
        data: { user: { id: found.id, email: found.email } },
        error: null,
      };
    },

    async signUp({
      email,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResult> {
      const id = generateUUID();
      setStoredUserId(id);
      return {
        data: { user: { id, email } },
        error: null,
      };
    },

    async getUser(): Promise<AuthResult> {
      // Browser: localStorage. Server: cookie passed in via opts.getCookie.
      const userId = getStoredUserId() ?? opts?.getCookie?.(AUTH_KEY) ?? null;
      if (!userId) {
        return { data: { user: null }, error: null };
      }
      const found = MOCK_USERS.find((u) => u.id === userId);
      if (!found) {
        return {
          data: { user: { id: userId, email: "new-user@example.com" } },
          error: null,
        };
      }
      return {
        data: { user: { id: found.id, email: found.email } },
        error: null,
      };
    },

    async signOut(): Promise<{ error: null }> {
      removeStoredUserId();
      return { error: null };
    },

    onAuthStateChange(
      _callback: (event: string, session: unknown) => void
    ): { data: { subscription: MockSubscription } } {
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              /* noop */
            },
          },
        },
      };
    },

    async exchangeCodeForSession(
      _code: string
    ): Promise<{ error: null }> {
      return { error: null };
    },
  };
}

// ----- Mock Realtime -----

function createMockChannel(_name: string): MockChannel {
  const ch: MockChannel = {
    on(_event: string, _config: unknown, _cb: unknown) {
      return ch;
    },
    subscribe() {
      return ch;
    },
  };
  return ch;
}

// ----- Public client interface -----

export interface MockSupabaseClient {
  auth: ReturnType<typeof createMockAuth>;
  from: (table: string) => MockQueryBuilder;
  channel: (name: string) => MockChannel;
  removeChannel: (channel: unknown) => void;
}

export interface CreateMockClientOptions {
  getCookie?: (name: string) => string | undefined;
}

export function createMockClient(
  opts?: CreateMockClientOptions
): MockSupabaseClient {
  return {
    auth: createMockAuth(opts),
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    channel(name: string) {
      return createMockChannel(name);
    },
    removeChannel() {
      /* noop */
    },
  };
}
