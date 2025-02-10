

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
        const zoom = 14;
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
                        const props = feature.properties || {}; // Отримуємо властивості
                        const popupContent = `
                            <div style="font-family: Arial, sans-serif; font-size: 14px;">
                                <h4 style="margin: 5px 0; font-size: 16px; color: #d9534f;">Інформація про ділянку</h4>
                                <div><b>Кадастровий номер:</b> ${props.cadnum || "Немає даних"}</div>
                                <div><b>Власність:</b> ${props.ownership || "Немає даних"}</div>
                                <div><b>Цільове призначення:</b> ${props.purpose || "Немає даних"}</div>
                                <div><b>Категорія:</b> ${props.category || "Немає даних"}</div>
                                <div>🔗<a href="https://kadastr.live/parcel/${props.cadnum}" target="_blank" style="color: blue; text-decoration: underline;"> Деталі ділянки</a></p>
                            </div>
                        `;
                    
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(popupContent)
                            .openOn(map);
                    });
                }
            }).addTo(map);

        } catch (error) {
            console.error("❌ Помилка:", error);
        }
    });
});

