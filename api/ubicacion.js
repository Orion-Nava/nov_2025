// api/ubicacion.js
// Inserta en Supabase vía REST sin usar el SDK (más robusto en serverless)

const ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SERVICE_KEY   = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

// CORS simple
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).send("Método no permitido");

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ ok:false, message:"Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
    }

    const { clave, lat, lon } = req.body || {};
    if (typeof clave !== "string" || !clave.trim())
      return res.status(400).json({ ok:false, message:"clave inválida" });

    const latNum = Number(lat), lonNum = Number(lon);
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90)
      return res.status(400).json({ ok:false, message:"latitud inválida" });
    if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180)
      return res.status(400).json({ ok:false, message:"longitud inválida" });

    const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString().slice(0,100);
    const ua = (req.headers["user-agent"] || "").toString().slice(0,200);

    // Inserción directa en PostgREST
    const url = `${SUPABASE_URL}/rest/v1/ubicaciones`;
    const payload = [{ clave: clave.trim(), lat: latNum, lon: lonNum, ip, ua }];

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* deja text crudo */ }

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        message: "Supabase insert error",
        supabase: typeof data === "object" ? data : { raw: text }
      });
    }

    return res.status(200).json({ ok: true, row: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, message:String(err?.message || err) });
  }
}
