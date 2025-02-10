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

        // Декодуємо PBF (Vector Tile)
        const tile = new VectorTile(new Pbf(arrayBuffer));

        // Перетворюємо в GeoJSON
        const features = [];
        for (let layerName in tile.layers) {
            let layer = tile.layers[layerName];
            for (let i = 0; i < layer.length; i++) {
                let feature = layer.feature(i).toGeoJSON(x, y, zoom);
                features.push(feature);
            }
        }

        const geoJsonData = {
            type: "FeatureCollection",
            features: features
        };

        // Додаємо полігони на карту
        L.geoJSON(geoJsonData, {
            style: {
                color: "red",  // Червоні контури
                weight: 2,
                fillColor: "rgba(255,0,0,0.3)",  // Напівпрозоре заповнення
                fillOpacity: 0.5
            }
        }).addTo(map);

    } catch (error) {
        console.error("❌ Помилка:", error);
    }
});
