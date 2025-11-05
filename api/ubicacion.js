// api/ubicacion.js  (Node serverless en Vercel)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  try {
    // 1) Validación de envs
    const missing = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SERVICE_ROLE) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missing.length) {
      return res.status(500).json({
        message: "Variables de entorno faltantes",
        missing,
      });
    }

    // 2) Import dinámico: evita errores de empaquetado (“module not found”)
    let createClient;
    try {
      ({ createClient } = await import("@supabase/supabase-js"));
    } catch (e) {
      return res.status(500).json({
        message: "No se pudo importar @supabase/supabase-js",
        error: String(e?.message || e),
      });
    }

    // 3) Parseo de body (puede venir string u objeto)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) {
        return res.status(400).json({ message: "JSON inválido en body", error: String(e) });
      }
    }

    const { clave, lat, lon } = body || {};
    if (typeof clave !== "string" || clave.trim().length === 0) {
      return res.status(400).json({ message: "clave inválida" });
    }
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).json({ message: "latitud inválida" });
    }
    if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ message: "longitud inválida" });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
    const ua = req.headers["user-agent"] || null;

    // 4) Supabase client con service role
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 5) Inserción
    const { error } = await supabase
      .from("ubicaciones")                 // usa 'public.ubicaciones' si tu tabla no está en search_path
      .insert([{ clave: clave.trim(), lat: latNum, lon: lonNum, ip, ua }]);

    if (error) {
      return res.status(500).json({
        message: "Supabase insert error",
        supabase: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Pase lo que pase devolvemos JSON para que el frontend lo muestre
    return res.status(500).json({ message: "Handler error", error: String(e?.message || e) });
  }
}

