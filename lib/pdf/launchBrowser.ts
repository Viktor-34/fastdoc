import os from 'node:os';
import path from 'node:path';
import { access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

type PuppeteerModule = typeof import('puppeteer-core');

async function fileIsExecutable(candidate: string) {
  try {
    await access(candidate, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveLocalExecutable(): Promise<string | null> {
  if (process.env.CHROME_EXECUTABLE_PATH?.trim()) {
    const explicit = process.env.CHROME_EXECUTABLE_PATH.trim();
    if (await fileIsExecutable(explicit)) {
      return explicit;
    }
    console.warn('[pdf] Указанный CHROME_EXECUTABLE_PATH недоступен:', explicit);
  }

  const platform = os.platform();
  const candidates: string[] = [];

  if (platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
    candidates.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
    if (process.env.HOME) {
      candidates.push(
        path.join(
          process.env.HOME,
          'Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ),
      );
    }
  } else if (platform === 'win32') {
    const roots = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
    ].filter(Boolean) as string[];
    const suffix = path.join('Google', 'Chrome', 'Application', 'chrome.exe');
    for (const root of roots) {
      candidates.push(path.join(root, suffix));
    }
    candidates.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    candidates.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
  } else {
    candidates.push('/usr/bin/google-chrome');
    candidates.push('/usr/bin/chromium');
    candidates.push('/usr/bin/chromium-browser');
    candidates.push('/snap/bin/chromium');
  }

  for (const candidate of candidates) {
    try {
      if (candidate && (await fileIsExecutable(candidate))) {
        return candidate;
      }
    } catch {
      // пропускаем несуществующие пути
    }
  }

  return null;
}

async function launchWithSparticuz(puppeteer: PuppeteerModule['default']) {
  const chromiumModule = await import('@sparticuz/chromium');
  const chromium = chromiumModule.default;
  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: executablePath ?? undefined,
    headless: true,
  });
}

function isServerlessEnvironment() {
  return (
    Boolean(process.env.AWS_REGION) ||
    Boolean(process.env.AWS_EXECUTION_ENV) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NETLIFY)
  );
}

export async function launchPdfBrowser() {
  const puppeteerModule = await import('puppeteer-core');
  const puppeteer = puppeteerModule.default;

  // На serverless-платформах сразу используем @sparticuz/chromium,
  // т.к. там нет системного браузера.
  if (isServerlessEnvironment()) {
    return launchWithSparticuz(puppeteer);
  }

  // На обычном сервере / локальной машине — ищем системный Chrome/Chromium.
  const executablePath = await resolveLocalExecutable();
  if (executablePath) {
    try {
      return await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      });
    } catch (error) {
      console.warn('[pdf] Не удалось запустить локальный Chrome, используем @sparticuz/chromium.', error);
    }
  } else {
    console.warn(
      '[pdf] ⚠️  Локальный Chrome/Chromium не найден. Переключаемся на @sparticuz/chromium.\n' +
        '     Для VPS рекомендуется установить: sudo apt install -y chromium\n' +
        '     Или задать CHROME_EXECUTABLE_PATH в .env',
    );
  }

  // Fallback на @sparticuz/chromium.
  return launchWithSparticuz(puppeteer);
}
