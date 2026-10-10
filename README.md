# InterviewMate AI

An interview preparation workspace with server-side OpenAI answers, local document text extraction, and authorized audio transcription.

## Deploy on Vercel
1. Import `Rohit-Singh-1991/InterviewMate` into Vercel.
2. Add `OPENAI_API_KEY` under Project Settings → Environment Variables for Production and Preview.
3. Redeploy. Optional: set `OPENAI_MODEL` (defaults to `gpt-4o-mini`).

## Included
- `/api/health` checks whether the server key exists.
- `/api/answer` generates practice answers using OpenAI.
- `/api/transcribe` transcribes user-selected audio recordings.
- Browser-side TXT, DOCX and selectable-text PDF extraction.

Scanned PDFs and screenshots require OCR, which is not included yet. The app does not covertly capture meeting audio or bypass interview monitoring. Use AI assistance only where it is permitted.

## Local development
`npm install && npm run dev`
