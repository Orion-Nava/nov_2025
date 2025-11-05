import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const { clave, lat, lon } = req.body;

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
    console.error(error);
    return res.status(500).json({ message: 'Error al insertar', error });
  }

  return res.status(200).json({ message: 'Ubicación guardada correctamente' });
}
