import { NextRequest, NextResponse } from "next/server";

/**
 * Простой in-memory rate limiter на основе sliding window.
 * Подходит для одного VPS-процесса. При необходимости заменить на Redis.
 */

interface RateLimitEntry {
  /** Временные метки запросов внутри текущего окна. */
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Максимум запросов за окно. */
  limit: number;
  /** Размер окна в миллисекундах. */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Периодическая очистка старых записей (каждые 5 минут).
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);

    // Запускаем очистку для каждого нового store.
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store!) {
        // Убираем записи, у которых все timestamps устарели.
        if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - CLEANUP_INTERVAL) {
          store!.delete(key);
        }
      }
    }, CLEANUP_INTERVAL).unref();
  }
  return store;
}

/**
 * Создаёт rate limiter с заданными параметрами.
 *
 * Использование:
 * ```ts
 * const limiter = createRateLimiter("upload", { limit: 20, windowMs: 60_000 });
 *
 * export async function POST(req: NextRequest) {
 *   const blocked = limiter(req);
 *   if (blocked) return blocked;
 *   // ... основная логика
 * }
 * ```
 */
export function createRateLimiter(name: string, options: RateLimiterOptions) {
  const { limit, windowMs } = options;
  const store = getStore(name);

  return function checkRateLimit(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(ip, entry);
    }

    // Удаляем timestamps за пределами окна.
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= limit) {
      const retryAfterMs = entry.timestamps[0] + windowMs - now;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((entry.timestamps[0] + windowMs) / 1000)),
          },
        },
      );
    }

    entry.timestamps.push(now);
    return null; // Не заблокирован.
  };
}
