// api/ubicacion.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// (opcional) limita CORS al dominio de tu frontend
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Método no permitido');

  try {
    const { clave, lat, lon } = req.body || {};
    if (!clave || typeof clave !== 'string' || clave.trim().length === 0) {
      return res.status(400).send('Clave inválida');
    }
    const latNum = Number(lat), lonNum = Number(lon);
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).send('Latitud inválida');
    }
    if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180) {
      return res.status(400).send('Longitud inválida');
    }

    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().slice(0, 200);
    const ua = (req.headers['user-agent'] || '').toString().slice(0, 200);

    const { error } = await supabase
      .from('ubicaciones')
      .insert({ clave: clave.trim(), lat: latNum, lon: lonNum, ip, ua });

    if (error) {
      console.error(error);
      return res.status(500).send('No se pudo guardar');
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send('Error inesperado');
  }
}
