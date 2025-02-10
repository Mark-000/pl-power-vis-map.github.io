// Імпортуємо бібліотеки через модулі
import L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";
import Pbf from "https://unpkg.com/pbf@3.2.1/dist/pbf.js";
import { VectorTile } from "https://unpkg.com/@mapbox/vector-tile@1.3.1/dist/vector-tile.js";

// Створюємо карту
const map = L.map("map").setView([49.8074, 23.9319], 16);

// Додаємо базову карту OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Функція для обчислення X/Y координат тайлу
function getTileCoordinates(lon, lat, zoom) {
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor(
        (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
    );
    return { x, y };
}

// Подія: Клік правою кнопкою миші
map.on("contextmenu", async function (e) {
    const zoom = 16;
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const tile = getTileCoordinates(lon, lat, zoom);

    const url = `https://cdn.kadastr.live/tiles/maps/kadastr/${zoom}/${tile.x}/${tile.y}.pbf`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Помилка завантаження тайлу: ${response.status}`);

        const buffer = await response.arrayBuffer();
        const tileData = new VectorTile(new Pbf(buffer));

        console.log("✅ MVT-тайл завантажено:", tileData);

    } catch (error) {
        console.error("❌ Помилка:", error);
    }
});
