import { expect, test } from '@playwright/test';

async function mockOllama(page: import('@playwright/test').Page) {
  await page.route('http://localhost:11434/**', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
      return;
    }
    const url = new URL(route.request().url());
    if (url.pathname === '/api/tags') {
      await route.fulfill({
        headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
        body: JSON.stringify({ models: [{ name: 'qwen2.5:3b' }] })
      });
      return;
    }
    await route.fulfill({
      headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        message: { role: 'assistant', content: 'Definition: A HashMap stores key-value pairs.\nReal-world use case: Fast lookup by key.\nCode: Map<String, Integer> counts = new HashMap<>();' }
      })
    });
  });
}

test('dashboard navigates to Live Copilot and accepts a question', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /prepare with clarity/i })).toBeVisible();
  await page.getByRole('button', { name: /start mock interview/i }).click();
  await expect(page.getByRole('heading', { name: /AI Answer Companion/i })).toBeVisible();
  const question = page.getByPlaceholder('How does HashMap work internally in Java?');
  await question.fill('How does HashMap work internally in Java?');
  await expect(page.getByRole('button', { name: /generate answer/i })).toBeEnabled();
});

test('question can be answered through the local Ollama API contract', async ({ page }) => {
  await mockOllama(page);
  await page.goto('/');
  await page.getByRole('button', { name: /start mock interview/i }).click();
  await page.getByPlaceholder('How does HashMap work internally in Java?').fill('How does HashMap work internally in Java?');
  await page.getByRole('button', { name: /generate answer/i }).click();
  await expect(page.getByText(/A HashMap stores key-value pairs/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Fast lookup by key/i)).toBeVisible();
});

test('Alt+A extension scan fragment opens Live Copilot and generates an answer', async ({ page }) => {
  await mockOllama(page);
  const scannedQuestion = 'Question: Explain Java HashMap collision handling.';
  await page.goto('/#scan=' + encodeURIComponent(scannedQuestion));
  await expect(page.getByRole('heading', { name: /AI Answer Companion/i })).toBeVisible();
  await expect(page.getByPlaceholder('How does HashMap work internally in Java?')).toHaveValue(/collision handling/i);
  await expect(page.getByText(/A HashMap stores key-value pairs/i)).toBeVisible({ timeout: 10_000 });
  await expect(page).not.toHaveURL(/#scan=/);
});

test('settings exposes the free local AI setup and analyzer accepts screenshot files', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: /Workspace Settings/i })).toBeVisible();
  await expect(page.getByText(/No paid AI API is used/i)).toBeVisible();
  await page.getByRole('button', { name: 'Question Analyzer', exact: true }).click();
  const upload = page.locator('input[type="file"]').last();
  await expect(upload).toHaveAttribute('accept', /\.png/);
  await expect(page.getByPlaceholder('Paste the question to understand…')).toBeVisible();
});

test('voice practice transcribes a detected question and generates an answer', async ({ page }) => {
  await mockOllama(page);
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = 'en-US';
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        window.setTimeout(() => {
          const finalResult: any = [{ transcript: 'How does Java HashMap work?' }];
          finalResult.isFinal = true;
          this.onresult?.({ resultIndex: 0, results: [finalResult] });
        }, 100);
      }
      stop() { this.onend?.(); }
    }
    (window as any).SpeechRecognition = MockSpeechRecognition;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /start mock interview/i }).click();
  await page.getByRole('button', { name: /start voice practice/i }).click();
  await expect(page.getByText(/Listening through your microphone/i)).toBeVisible();
  await expect(page.getByText(/A HashMap stores key-value pairs/i)).toBeVisible({ timeout: 15_000 });
});

test('screenshot OCR extracts a question locally in the browser', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Question Analyzer', exact: true }).click();
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 220;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000';
    context.font = 'bold 58px Arial';
    context.fillText('How does HashMap work in Java?', 24, 125);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: 'interview-question.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64')
  });
  await expect(page.getByPlaceholder('Paste the question to understand…')).toHaveValue(/HashMap/i, { timeout: 75_000 });
});
