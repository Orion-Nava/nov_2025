import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  try {
    // Asegurarse de que el cuerpo esté parseado correctamente
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { clave, lat, lon } = body;

    if (!clave || !lat || !lon) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Insertar en Supabase
    const { error } = await supabase.from('ubicaciones').insert([
      {
        clave,
        lat,
        lon,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        ua: req.headers['user-agent'] || null,
      },
    ]);

    if (error) {
      console.error('Error al insertar en Supabase:', error);
      return res.status(500).json({ message: 'Error al insertar', error });
    }

    return res.status(200).json({ message: 'Ubicación guardada correctamente' });
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ message: 'Error interno del servidor', err });
  }
}
