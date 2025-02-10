// Імпортуємо бібліотеки через модулі
import L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";
import { VectorTile } from "https://cdn.skypack.dev/@mapbox/vector-tile";
import Pbf from "https://cdn.skypack.dev/pbf";


// Ініціалізація карти
const map = L.map("map").setView([49.807405, 23.931917], 16);

// Додаємо базовий шар (OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
}).addTo(map);

// Додаємо обробник кліку правою кнопкою
map.on("contextmenu", async function (e) {
    const { lat, lng } = e.latlng;
    console.log(`📍 Клік: ${lat}, ${lng}`);

    // Конвертуємо в координати тайлу
    const zoom = 16;
    const tileSize = 256;
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    console.log(`🗺️ Тайл: (${x}, ${y}) на рівні ${zoom}`);

    // Формуємо URL запиту до кадастру
    const url = `https://cdn.kadastr.live/tiles/maps/kadastr/${zoom}/${x}/${y}.pbf`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Помилка завантаження: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        console.log("✅ MVT тайл отримано!", arrayBuffer);

        // Тут можна додати розбір MVT, якщо потрібно
        L.marker([lat, lng]).addTo(map).bindPopup("📌 Точка вибору").openPopup();
    } catch (error) {
        console.error("❌ Помилка:", error);
    }
});
