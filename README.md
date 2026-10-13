# InterviewMate — Free Local AI

InterviewMate is a free interview-practice workspace. **AI answers run through Ollama on your own computer.** The app has no paid AI provider, API key, subscription, or usage-metered fallback.

## One-time setup on Windows

1. Install or update Ollama from https://ollama.com/download.
2. Open PowerShell and run:
   ```powershell
   ollama --version
   ollama pull qwen2.5:3b
   ollama list
   ```
3. In Windows **Edit environment variables for your account**, add or update this user variable:
   - Name: `OLLAMA_ORIGINS`
   - Value: `https://interviewmate-three.vercel.app`
4. Fully quit Ollama from the system tray, then start it again. The setting is not picked up until Ollama restarts.
5. Open https://interviewmate-three.vercel.app → Settings → **Check server connection**.

The model uses your computer's CPU/GPU, memory, disk space, electricity, and local Ollama process. There are no AI API usage charges. The web interface is deployed to Vercel; hosting remains subject to the limits of the selected Vercel plan.

## If `http://localhost:11434/api/tags` returns 404

The Ollama local API's documented model-list endpoint is `GET /api/tags`. A 404 means the service answering on that port is not serving the expected endpoint, or the local Ollama installation/server needs attention. See the official API reference: https://github.com/ollama/ollama/blob/main/docs/api.md.

In PowerShell run these commands one at a time:
```powershell
ollama --version
ollama list
curl.exe -i http://localhost:11434/api/tags
curl.exe -i http://127.0.0.1:11434/api/tags
```

A working endpoint returns HTTP 200 and JSON containing a `models` array. If either address works, use that address to test your local server. If both return 404:
- Fully quit Ollama from the system tray and reopen it.
- If it still happens, update/reinstall Ollama from https://ollama.com/download, then rerun `ollama list` and the `curl.exe` tests.
- `Qwen Code` is a separate coding CLI and is **not required** by InterviewMate. Do not run its installer to set up InterviewMate.

Do not expose port 11434 to the public internet. Keep `OLLAMA_ORIGINS` limited to the InterviewMate website. If the endpoint works in PowerShell but the site cannot reach it, check Chrome's local-network permission prompt and verify the origin variable, then restart Ollama.

## Free features

- Live Copilot answers from local `qwen2.5:3b` via Ollama.
- Interview Prep and Question Analyzer use the same local model.
- Browser-side extraction for TXT, Markdown, DOCX, and selectable-text PDF files.
- Voice practice via browser speech recognition after the user explicitly starts it.
- History held in the current browser session.
- Optional Chrome extension in `extension/`: press **Alt+A** to scan readable text on the active tab and open InterviewMate. It does not automatically run on every page.

Uploaded audio-file transcription and OCR for images/scanned PDFs are not included. Use Voice practice or paste a transcript/text instead. The browser's speech-recognition implementation may use browser-provided services; it does not call an InterviewMate paid AI API.

## Run locally

```powershell
npm install
npm run dev
```

Use only in mock interviews or other situations where AI assistance is permitted. Voice practice uses the microphone only after you click Start; it does not directly capture Teams/Meet/Zoom system audio or identify speakers.
