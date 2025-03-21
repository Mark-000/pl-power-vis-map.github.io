

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
        const zoom = 13;
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
                style: function (feature) {
                    let fillColor = "rgba(255,0,0,0.3)"; // Червона заливка за замовчуванням
            
                    if (feature.properties.ownership === "Комунальна власність" || 
                        feature.properties.ownership === "Державна власність") {
                        fillColor = "rgba(0, 0, 255, 0.5)"; // Синя заливка для комунальної та державної власності
                    }
            
                    // Умова для голубої заливки
                    const bluePurposeCodes = [
                        "02.01", "02.02", "02.03", "02.04", "02.05", "02.06", "02.07", "02.08",
                        "02.09", "02.10", "03.01", "03.02", "03.03", "03.04", "03.05", "03.06", 
                        "03.15", "07.01", "07.03", "07.04", "07.05"
                    ];
            
                    if (bluePurposeCodes.includes(feature.properties.purpose_code) || 
                        (feature.properties.category && feature.properties.category.includes("Землі житлової та громадської забудови"))) {
                        fillColor = "rgba(0, 238, 255, 0.51)"; // Голуба заливка
                    }
            
                    return {
                        color: "#d11d1d",
                        weight: 1,
                        fillColor: fillColor,
                        fillOpacity: 0.5
                    };
                },
                onEachFeature: function (feature, layer) {
                    layer.on("click", function (e) {
                        const props = feature.properties || {};
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
    map.on("mousedown", function (e) {
    if (e.originalEvent.button === 1) { // Перевіряємо, чи натиснуто колесико (button 1)
        e.originalEvent.preventDefault();

        if (cadastralLayer) {
            map.removeLayer(cadastralLayer);
            cadastralLayer = null;
            console.log("🧹 Кадастровий шар видалено!");
        }
    }
});

});


