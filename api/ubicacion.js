<script>
  window.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([19.4326, -99.1332], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    let marker = null, position = null;
    map.on("click", (e) => {
      position = e.latlng;
      if (marker) marker.remove();
      marker = L.marker(position).addTo(map);
    });

    const msg = document.getElementById("mensaje");

    document.getElementById("enviar").addEventListener("click", async () => {
      const clave = document.getElementById("clave").value.trim();
      if (!clave || !position) {
        msg.textContent = "Error: falta la clave o seleccionar un punto en el mapa.";
        return;
      }
      msg.textContent = "Enviando...";

      try {
        const r = await fetch("/api/ubicacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave, lat: position.lat, lon: position.lng })
        });

        let payload = {};
        try { payload = await r.json(); } catch {}

        if (!r.ok) {
          const s = payload?.supabase
            ? ` | code=${payload.supabase.code} | message=${payload.supabase.message} | details=${payload.supabase.details ?? ""}`
            : "";
          msg.textContent = `Error: ${payload?.message || r.statusText}${s}`;
          return;
        }
        msg.textContent = "✅ Ubicación guardada correctamente.";
      } catch (e) {
        msg.textContent = "Error: " + (e?.message || e);
      }
    });
  });
</script>
