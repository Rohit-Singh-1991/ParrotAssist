export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const configured = Boolean(process.env.OPENAI_API_KEY);
  return res.status(200).json({ configured, provider: 'OpenAI', message: configured ? 'Server key detected. Submit a test question to verify OpenAI API access.' : 'Server reachable; OPENAI_API_KEY is missing in Vercel.' });
}
