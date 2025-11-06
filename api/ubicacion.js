// api/ubicacion.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  try {
    // Variables de entorno (definidas en Vercel)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ ok: false, message: 'Faltan variables de entorno en el servidor.' });
    }

    // Crear cliente Supabase con la clave de servicio (bypassa RLS)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { clave, ruta, lat, lon, distancia_a_ruta } = req.body;

    // Validaciones básicas
    if (!clave || !lat || !lon) {
      return res.status(400).json({ ok: false, message: 'Faltan datos requeridos (clave, lat o lon).' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const ua = req.headers['user-agent'] || 'Desconocido';

    const { error } = await supabase
      .from('ubicaciones')
      .insert([{
        clave,
        ruta: ruta || null,
        lat,
        lon,
        distancia_a_ruta: distancia_a_ruta ?? null,
        ip,
        ua
      }]);

    if (error) {
      console.error('Error Supabase:', error.message);
      return res.status(400).json({ ok: false, message: error.message });
    }

    return res.status(200).json({
      ok: true,
      message: '✅ Registro guardado correctamente en Supabase.',
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
}
