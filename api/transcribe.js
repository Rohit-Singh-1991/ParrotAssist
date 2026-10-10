import OpenAI from 'openai';
import Busboy from 'busboy';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Add OPENAI_API_KEY in Vercel and redeploy.' });
  let bb;
  try { bb = Busboy({ headers: req.headers, limits: { fileSize: 24 * 1024 * 1024, files: 1 } }); }
  catch { return res.status(400).json({ error: 'Send multipart/form-data with one audio file.' }); }
  try {
    const chunks = []; let filename = 'interview.webm', mime = 'audio/webm', tooLarge = false, gotFile = false;
    const done = new Promise((resolve, reject) => {
      bb.on('file', (name, stream, info) => { gotFile = true; filename = info.filename || filename; mime = info.mimeType || mime; stream.on('data', chunk => chunks.push(Buffer.from(chunk))); stream.on('limit', () => { tooLarge = true; }); });
      bb.on('error', reject); bb.on('finish', resolve);
    });
    req.pipe(bb); await done;
    if (tooLarge) return res.status(413).json({ error: 'Audio file must be under 24 MB.' });
    if (!gotFile || !chunks.length) return res.status(400).json({ error: 'Select a recorded audio file first.' });
    const file = await OpenAI.toFile(Buffer.concat(chunks), filename, { type: mime });
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60000, maxRetries: 1 });
    const out = await ai.audio.transcriptions.create({ file, model: 'gpt-4o-mini-transcribe', response_format: 'json', prompt: 'Interview conversation. Preserve technical terms such as Java, Angular, Spring Boot, SQL, API and Kubernetes.' });
    return res.status(200).json({ text: out.text, provider: 'OpenAI' });
  } catch (e) { return res.status(e.status === 401 ? 401 : e.status === 429 ? 429 : 502).json({ error: e.status === 401 ? 'OpenAI rejected the configured server key.' : e.status === 429 ? 'OpenAI quota or rate limit reached.' : 'Transcription failed. Check supported audio format and deployment logs.' }); }
}
