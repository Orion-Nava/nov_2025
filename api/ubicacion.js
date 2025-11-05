// api/ubicacion.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// --- Diagnóstico temprano de variables ---
function missingEnv() {
  const miss = [];
  if (!SUPABASE_URL) miss.push('SUPABASE_URL');
  if (!SERVICE_ROLE) miss.push('SUPABASE_SERVICE_ROLE_KEY');
  return miss;
}

const supabase = (SUPABASE_URL && SERVICE_ROLE)
  ? createClient(SUPABASE_URL, SERVICE_ROLE)
  : null;

export default async function handler(req, res) {
  // CORS básico (permite tu dominio de Vercel)
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  // Verifica env vars
  const miss = missingEnv();
  if (miss.length) {
    return res.status(500).json({
      message: 'Variables de entorno faltantes en Vercel',
      missing: miss
    });
  }

  try {
    // Cuerpo puede llegar como string o como objeto
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { clave, lat, lon } = body || {};

    // Validaciones claras
    if (typeof clave !== 'string' || clave.trim().length === 0) {
      return res.status(400).json({ message: 'clave inválida' });
    }
    const latNum = Number(lat), lonNum = Number(lon);
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).json({ message: 'latitud inválida' });
    }
    if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ message: 'longitud inválida' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    const ua = req.headers['user-agent'] || null;

    // Inserción en Supabase
    const { error } = await supabase
      .from('ubicaciones')
      .insert([{ clave: clave.trim(), lat: latNum, lon: lonNum, ip, ua }]);

    if (error) {
      // Regresa mensaje y código exactos desde Supabase
      return res.status(500).json({
        message: 'Supabase insert error',
        supabase: { code: error.code, details: error.details, hint: error.hint, message: error.message }
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Cualquier otro error (p. ej., JSON inválido)
    return res.status(500).json({ message: 'Handler error', error: String(err?.message || err) });
  }
}
