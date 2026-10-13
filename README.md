# InterviewMate AI

An interview preparation workspace with server-side OpenAI answers, local document text extraction, and user-selected audio transcription.

## Deploy on Vercel
1. Import `Rohit-Singh-1991/InterviewMate` into Vercel.
2. Add `OPENAI_API_KEY` under Project Settings → Environment Variables for Production and Preview.
3. Redeploy. Optional: set `OPENAI_MODEL` (defaults to `gpt-4o-mini`).

## Included
- `/api/health` checks whether the server key exists.
- `/api/answer` generates answers using OpenAI.
- `/api/transcribe` transcribes user-selected audio recordings.
- Browser-side TXT, DOCX and selectable-text PDF extraction.
- Optional Chrome extension in `extension/`: press **Alt+A** to scan readable text on the active tab and open InterviewMate with a concise answer. It uses an explicit keyboard command and does not run on every page automatically.
- The extension sends the extracted text in a URL fragment, which is removed from browser history by the app on load. Avoid scanning pages containing passwords, personal data, or confidential information.

## Install the Chrome extension
1. Download the repository as a ZIP and extract it, or clone it locally.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Select **Load unpacked** and choose the `extension` folder.
4. Open a page containing a practice question, then press **Alt+A**. InterviewMate opens in a new tab and generates a concise answer.
5. If the shortcut conflicts with another app, change it at `chrome://extensions/shortcuts`.

The extension requires access to the page you choose to scan. It cannot read Chrome internal pages, some protected sites, or text drawn only inside a canvas/image. It scans the page text; it does not submit forms or interact with the page.

## Voice practice and privacy
The current app supports uploading an audio recording you are allowed to transcribe. It does **not** continuously listen to Teams/Meet/Zoom, distinguish speakers in real time, or secretly capture system audio. For live practice, use a visible, consent-based audio workflow and confirm participants are comfortable with recording/transcription. Browser microphone access alone may not capture remote meeting audio when headphones are used.

## Local development
`npm install && npm run dev`
