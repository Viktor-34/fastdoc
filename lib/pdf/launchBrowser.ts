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
    defaultViewport: chromium.defaultViewport ?? { width: 1280, height: 720 },
    executablePath: executablePath ?? undefined,
    headless: chromium.headless ?? true,
  });
}

function isServerlessEnvironment() {
  return (
    process.platform === 'linux' ||
    Boolean(process.env.AWS_REGION) ||
    Boolean(process.env.AWS_EXECUTION_ENV) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.CHROME_BINARY_PATH)
  );
}

export async function launchPdfBrowser() {
  const puppeteerModule = await import('puppeteer-core');
  const puppeteer = puppeteerModule.default;

  if (isServerlessEnvironment()) {
    return launchWithSparticuz(puppeteer);
  }

  const executablePath = await resolveLocalExecutable();
  if (executablePath) {
    try {
      return await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu'],
      });
    } catch (error) {
      console.warn('[pdf] Не удалось запустить локальный Chrome, используем @sparticuz/chromium.', error);
    }
  } else {
    console.warn('[pdf] Локальный Chrome не найден, переключаемся на @sparticuz/chromium.');
  }

  return launchWithSparticuz(puppeteer);
}
