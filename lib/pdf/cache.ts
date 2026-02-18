import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Система кеширования для PDF файлов
 * Сохраняет сгенерированные PDF в файловую систему для быстрого повторного использования
 */

const CACHE_DIR = join(process.cwd(), '.cache', 'pdf');
const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24; // 24 часа
const MAX_CACHE_SIZE_MB = 500; // Максимальный размер кеша в МБ

interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
  size: number;
}

/**
 * Генерирует уникальный ключ кеша на основе содержимого документа
 */
export function generateCacheKey(documentId: string, jsonContent: string): string {
  const hash = createHash('sha256');
  hash.update(`${documentId}:${jsonContent}`);
  return hash.digest('hex');
}

/**
 * Инициализирует директорию кеша
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

/**
 * Получает путь к файлу кеша
 */
function getCachePath(key: string): string {
  return join(CACHE_DIR, `${key}.pdf`);
}

/**
 * Получает метаданные файла кеша
 */
async function getCacheMeta(key: string): Promise<{ exists: boolean; size: number; age: number } | null> {
  try {
    const path = getCachePath(key);
    const stats = await fs.stat(path);
    const age = Date.now() - stats.mtimeMs;
    
    return {
      exists: true,
      size: stats.size,
      age,
    };
  } catch {
    return null;
  }
}

/**
 * Проверяет, валиден ли кеш
 */
async function isCacheValid(key: string): Promise<boolean> {
  const meta = await getCacheMeta(key);
  if (!meta || !meta.exists) return false;
  
  // Проверяем возраст кеша
  if (meta.age > MAX_CACHE_AGE_MS) {
    await deleteCacheEntry(key);
    return false;
  }
  
  return true;
}

/**
 * Получает PDF из кеша
 */
export async function getCachedPdf(key: string): Promise<Buffer | null> {
  try {
    const valid = await isCacheValid(key);
    if (!valid) return null;
    
    const path = getCachePath(key);
    const buffer = await fs.readFile(path);
    
    console.log(`[PDF Cache] HIT: ${key}`);
    return buffer;
  } catch (error) {
    console.error(`[PDF Cache] Error reading cache:`, error);
    return null;
  }
}

/**
 * Сохраняет PDF в кеш
 */
export async function setCachedPdf(key: string, buffer: Buffer): Promise<void> {
  try {
    await ensureCacheDir();
    const path = getCachePath(key);
    await fs.writeFile(path, buffer);
    
    console.log(`[PDF Cache] SET: ${key} (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    // Асинхронно проверяем и очищаем старые файлы
    cleanupCache().catch(err => console.error('[PDF Cache] Cleanup error:', err));
  } catch (error) {
    console.error(`[PDF Cache] Error writing cache:`, error);
  }
}

/**
 * Удаляет запись из кеша
 */
async function deleteCacheEntry(key: string): Promise<void> {
  try {
    const path = getCachePath(key);
    await fs.unlink(path);
    console.log(`[PDF Cache] DELETE: ${key}`);
  } catch (error) {
    // Игнорируем ошибки удаления
  }
}

/**
 * Очищает устаревшие записи кеша
 */
async function cleanupCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    
    let totalSize = 0;
    const entries: Array<{ file: string; mtime: number; size: number }> = [];
    
    // Собираем информацию о всех файлах
    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;
      
      try {
        const path = join(CACHE_DIR, file);
        const stats = await fs.stat(path);
        const age = Date.now() - stats.mtimeMs;
        
        // Удаляем устаревшие файлы
        if (age > MAX_CACHE_AGE_MS) {
          await fs.unlink(path);
          console.log(`[PDF Cache] Removed expired: ${file}`);
          continue;
        }
        
        entries.push({ file, mtime: stats.mtimeMs, size: stats.size });
        totalSize += stats.size;
      } catch {
        // Игнорируем ошибки чтения файлов
      }
    }
    
    // Если размер кеша превышает лимит, удаляем самые старые файлы
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      // Сортируем по времени модификации (от старых к новым)
      entries.sort((a, b) => a.mtime - b.mtime);
      
      for (const entry of entries) {
        if (totalSize <= maxSizeBytes) break;
        
        try {
          await fs.unlink(join(CACHE_DIR, entry.file));
          totalSize -= entry.size;
          console.log(`[PDF Cache] Removed to free space: ${entry.file}`);
        } catch {
          // Игнорируем ошибки удаления
        }
      }
    }
    
    console.log(`[PDF Cache] Cleanup complete. Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('[PDF Cache] Cleanup failed:', error);
  }
}

/**
 * Очищает весь кеш
 */
export async function clearCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        await fs.unlink(join(CACHE_DIR, file));
      }
    }
    
    console.log('[PDF Cache] Cache cleared');
  } catch (error) {
    console.error('[PDF Cache] Clear cache failed:', error);
  }
}

/**
 * Получает статистику кеша
 */
export async function getCacheStats(): Promise<{
  count: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    
    let count = 0;
    let totalSize = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    
    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;
      
      try {
        const path = join(CACHE_DIR, file);
        const stats = await fs.stat(path);
        
        count++;
        totalSize += stats.size;
        
        if (!oldestEntry || stats.mtimeMs < oldestEntry) {
          oldestEntry = stats.mtimeMs;
        }
        if (!newestEntry || stats.mtimeMs > newestEntry) {
          newestEntry = stats.mtimeMs;
        }
      } catch {
        // Игнорируем ошибки чтения файлов
      }
    }
    
    return { count, totalSize, oldestEntry, newestEntry };
  } catch {
    return { count: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
  }
}



