export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const N8N = process.env.N8N_WEBHOOK_URL
  if (!N8N) return res.status(500).json({ error: 'N8N webhook not configured on server' })

  try {
    // reenvía exactamente el body al webhook de n8n
    const proxied = await fetch(N8N, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const data = await proxied.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('proxy error', err)
    return res.status(502).json({ error: 'Error contacting n8n' })
  }
}
