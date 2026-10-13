# InterviewMate AI

An interview preparation workspace with a **free local AI option**, local document text extraction, and user-selected voice practice.

## Free local AI (recommended)

The deployed website runs in your browser, while Ollama runs the language model on your own computer. This avoids paid API usage; performance depends on your computer.

1. Install Ollama: https://ollama.com/download
2. Open PowerShell or Command Prompt and run:
   ```powershell
   ollama pull qwen2.5:3b
   ```
3. Allow the deployed website to call local Ollama. In Windows, open **Edit environment variables for your account**, add a user variable:
   - Name: `OLLAMA_ORIGINS`
   - Value: `https://interviewmate-three.vercel.app`
4. Fully quit and restart Ollama so it reads the new variable. If needed, restart Windows.
5. Open https://interviewmate-three.vercel.app → **Settings** → choose **Free local AI (Ollama)** → **Check server connection**.
6. If it cannot connect, verify Ollama is running and visit `http://localhost:11434/api/tags` on the same computer. The site can only use this local model from the computer running Ollama.

Do not expose Ollama's port to the public internet. Keep the allowed origin restricted to the InterviewMate domain.

## Deploy on Vercel

1. Import `Rohit-Singh-1991/InterviewMate` into Vercel.
2. For optional paid cloud answers, add `OPENAI_API_KEY` under Project Settings → Environment Variables for Production and Preview.
3. Redeploy after changing environment variables.

**Free mode does not need an OpenAI API key.** If you choose OpenAI in Settings, usage may incur charges. Audio-file transcription currently uses the OpenAI API; use the in-browser Voice practice for a free alternative.

## Included

- **Free local AI:** Qwen 2.5 3B via Ollama running on your computer.
- Optional OpenAI cloud answers through server-side `/api/answer`.
- `/api/health` checks the optional cloud key.
- User-selected audio transcription via `/api/transcribe` (cloud API).
- Browser-side TXT, DOCX and selectable-text PDF extraction.
- Optional Chrome extension in `extension/`: press **Alt+A** to scan readable text on the active tab and open InterviewMate with a concise answer. It uses an explicit keyboard command and does not run on every page automatically.
- The extension sends extracted text in a URL fragment, which is removed from browser history on load. Avoid scanning pages containing passwords, personal data, or confidential information.
- Visible voice practice uses browser speech recognition after you click Start. In free mode, generated answers use your local Ollama model.

## Install the Chrome extension

1. Download the repository as a ZIP and extract it, or clone it locally.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Select **Load unpacked** and choose the `extension` folder.
4. Open a practice question page, then press **Alt+A**. InterviewMate opens in a new tab and generates a concise answer.
5. If the shortcut conflicts with another app, change it at `chrome://extensions/shortcuts`.

The extension requires access to the page you choose to scan. It cannot read Chrome internal pages, some protected sites, or text drawn only inside a canvas/image. It scans page text; it does not submit forms or interact with the page.

## Voice practice and privacy

The visible voice practice mode uses your microphone and the browser's speech-recognition service. It can transcribe room speech and auto-answer question-like phrases after a short pause, but it does **not** identify speakers or directly capture Teams/Meet/Zoom system audio. It may not hear the remote participant if you use headphones. Use only with your friend's knowledge and consent. Uploaded recordings should only be transcribed when you have permission.

## Local development

`npm install && npm run dev`
