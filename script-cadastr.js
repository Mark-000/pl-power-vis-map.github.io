

// Чекаємо, поки завантажаться Pbf і VectorTile
(async function () {
    window.Pbf = (await import("https://cdn.skypack.dev/pbf")).default;
    window.VectorTile = (await import("https://cdn.skypack.dev/@mapbox/vector-tile")).VectorTile;

    console.log("✅ Бібліотеки завантажено!");
})();

// Обробник кліку правою кнопкою
let cadastralLayer = null; // Глобальна змінна для полігонів

document.addEventListener("DOMContentLoaded", () => {
    map.on("contextmenu", async function (e) {
        const { lat, lng } = e.latlng;
        console.log(`📍 Клік: ${lat}, ${lng}`);

        // Конвертуємо в координати тайлу
        const zoom = 15;
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

            console.log("🛰️ Отримані дані у форматі GeoJSON:", JSON.stringify(geoJsonData, null, 2));

            // ❌ Видаляємо попередній шар перед додаванням нового
            if (cadastralLayer) {
                map.removeLayer(cadastralLayer);
            }

            // Додаємо новий шар полігонів
            cadastralLayer = L.geoJSON(geoJsonData, {
                style: {
                    color: "red",
                    weight: 2,
                    fillColor: "rgba(255,0,0,0.3)",
                    fillOpacity: 0.5
                },
                onEachFeature: function (feature, layer) {
                    // Додаємо popup з інформацією при кліку
                    layer.on("click", function (e) {
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(`<b>Інформація про ділянку:</b><br>${JSON.stringify(feature.properties, null, 2)}`)
                            .openOn(map);
                    });
                }
            }).addTo(map);

        } catch (error) {
            console.error("❌ Помилка:", error);
        }
    });
});

