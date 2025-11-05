// api/ubicacion.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Crear cliente con clave de servicio (bypassa RLS)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { clave, lat, lon } = req.body;

    if (!clave || !lat || !lon) {
      return res.status(400).json({ ok: false, message: 'Faltan datos requeridos' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'Desconocido';

    const { error } = await supabase
      .from('ubicaciones')
      .insert([{ clave, lat, lon, ip, ua }]);

    if (error) {
      console.error('Error Supabase:', error.message);
      return res.status(400).json({ ok: false, message: error.message });
    }

    return res.status(200).json({ ok: true, message: 'Registro guardado correctamente' });

  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ ok: false, message: 'Error del servidor' });
  }
}
