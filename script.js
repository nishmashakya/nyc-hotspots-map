const apiUrlMap = 'https://data.cityofnewyork.us/resource/yjub-udmw.json?$query=SELECT%20objectid%2C%20borough%2C%20boroname%2C%20type%2C%20provider%2C%20name%2C%20location%2C%20latitude%2C%20longitude%2C%20x%2C%20y%2C%20location_t%2C%20location_lat_long%2C%20remarks%2C%20city%2C%20ssid%2C%20sourceid%2C%20activated%2C%20borocode%2C%20ntacode%2C%20ntaname%2C%20coundist%2C%20zip%2C%20borocd%2C%20ct2010%2C%20bctcb2010%2C%20bin%2C%20bbl%2C%20doitt_id';


const form = document.querySelector('.form_main');
const submit = document.querySelector('button[type="submit"]');
const loadAnimation = document.querySelector('.lds-ellipsis');
const hotspotName = document.querySelector('#hotspot'); 


async function promiseData(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const request = await fetch(url);
        const json = await request.json();
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
  }


function initMap() {
    const map = L.map('map').setView([40.73, -73.90], 12); // center
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 13,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    return map;
}

// placing markers on map ... libraries = data array, map = the map we initialized
function markerPlace(hotspots, map) {
    // check for and remove existing markers on layer
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            layer.remove();
        }
    });
    // console.log("data arr:", hotspots);

    // foreach loop -- add marker for each location
    hotspots.forEach((spot) => {
        // console.log("hey");
        if (spot.location_lat_long) {
            const [lon, lat] = [spot.location_lat_long.longitude, spot.location_lat_long.latitude]; 
            // console.log(`Hotspot coords: ${spot.ssid}, Lat: ${lat}, Lon: ${lon}`);
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${spot.ssid}`);
        }
    });
}



// fetch data and call func to place markers on map
async function loadHotspotData(url) {
    const map = initMap(); // initialize
    const response = await fetch(url); // fetch... use peomise!!!!!!!!!!!!!!!!!
    const hotspots = await response.json(); // convertt to json

    markerPlace(hotspots, map); //  put markers on map
    return hotspots;

}

function injectHTML(list) {
    const target = document.querySelector('#results_box');
    target.innerHTML = '';
    list.forEach((item) => {
        const str = `<div class="output">${item.provider}</br>ZIP: ${item.zip}</div></br>`;
        target.innerHTML += str;
    });
}


// for updating/flktering
function clearMarkers(map) {
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

// hotspotName
async function mainEvent() {
    

    const arrayJSON = await loadHotspotData(apiUrlMap);

    if (arrayJSON.length > 0) {
        // hide the load animation
        loadAnimation.classList.remove('lds-ellipsis');
        loadAnimation.classList.add('lds-ellipsis_hidden');

        // filter 
        let currentArray = arrayJSON;
        hotspotName.addEventListener('input', (event) => {
            if (!currentArray.length) { return; }

            // console.log(hotspotName.value.toLowerCase());

            // if (event.keyCode === 13) { // enter
            console.log(hotspotName.value);
            const searchQuery = hotspotName.value.toLowerCase();
            const filteredHotspots = currentArray
                .filter((item) => {
                    const providerName = item.provider ? item.provider.toLowerCase() : '';
                    return providerName.includes(searchQuery);
                })
                .filter((item) => Boolean(item.location_lat_long));

            // filtered results and markers
            injectHTML(filteredHotspots);
            clearMarkers(map);
            markerPlace(filteredHotspots, map);
            // }
            
        });

    }
}


document.addEventListener('DOMContentLoaded', async () => mainEvent());




