// defining all variables

const apiUrlMap =
    "https://data.cityofnewyork.us/resource/yjub-udmw.json?$query=SELECT%20objectid%2C%20borough%2C%20boroname%2C%20type%2C%20provider%2C%20name%2C%20location%2C%20latitude%2C%20longitude%2C%20x%2C%20y%2C%20location_t%2C%20location_lat_long%2C%20remarks%2C%20city%2C%20ssid%2C%20sourceid%2C%20activated%2C%20borocode%2C%20ntacode%2C%20ntaname%2C%20coundist%2C%20zip%2C%20borocd%2C%20ct2010%2C%20bctcb2010%2C%20bin%2C%20bbl%2C%20doitt_id";

let map;

const form = document.querySelector(".form_main");
const submit = document.querySelector('button[type="submit"]');
const loadAnimation = document.querySelector(".lds-ellipsis");
const hotspotName = document.querySelector("#hotspot");
const mapContent = document.querySelector(".content");

const dropdownBorough = document.querySelector("#filter-borough");
const dropdownAccess = document.querySelector("#filter-access");
const dropdownLocation = document.querySelector("#filter-location");

const clearFilters = document.querySelector("#clear-filters");
const clearSearch = document.querySelector("#clear-search");



const viewDatasetButton = document.querySelector("#button-to-data");
const viewMapButton = document.querySelector("#button-to-bottom");


const loader = document.querySelector('.loader');


// function to filter markers - take in the mpa, the current selected options, and the data array (hotspots)
function filterMarkers(selectedBorough, selectedAccess, selectedLocation, map, hotspots) {
    // console.log("Filtering markers for borough: ", selection);
    // let filteredHotspots = hotspots;

    // // brough filter checks item.boroname
    // // access filter checks item.type
    // // location filter checks item.location_t

    let filteredHotspots = hotspots.filter((item) => {
        // from array data
        const boroughName = item.boroname ? item.boroname.toLowerCase() : "";
        const accessName = item.type ? item.type.toLowerCase() : "";
        const locationName = item.location_t ? item.location_t.toLowerCase() : "";
        // check for values of each filter ... conditions (etiher default or has the value passed in)
        const matchesBorough = !selectedBorough || boroughName.includes(selectedBorough.toLowerCase());
        const matchesAccess = !selectedAccess || accessName.includes(selectedAccess.toLowerCase());
        const matchesLocation = !selectedLocation || locationName.includes(selectedLocation.toLowerCase());
        // true if all active filters matxhed
        return matchesBorough && matchesAccess && matchesLocation;
    });

    // only if valiad location
    filteredHotspots = filteredHotspots.filter((item) => Boolean(item.location_lat_long));

    // filtered results and markers
    injectHTML(filteredHotspots);
    clearMarkers(map);
    markerPlace(filteredHotspots, map);
}

// promisidfied async
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

// initialize map -- leaflet documdentation
function initMap() {
    const map = L.map("map").setView([40.73, -73.9], 12); // center
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 13,
        attribution: "© OpenStreetMap",
    }).addTo(map);
    return map;
}

// placing markers on map ... libraries = data array, map = the map we initialized
function markerPlace(hotspots, map) {
    // check for and remove existing markers on layer
    map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
            layer.remove();
        }
    });
    // console.log("data arr:", hotspots);

    // foreach loop -- add marker for each location
    hotspots.forEach((spot) => {
        // console.log("hi");
        if (spot.location_lat_long) {
            const [lon, lat] = [
                spot.location_lat_long.longitude,
                spot.location_lat_long.latitude,
            ];

            // get boroughs and then call function to get corresponding color
            const borough = spot.boroname || ""; // empty ig no boroname
            const color = getMarkerColor(borough);

            // markers... make with color
            const circleMarker = L.circleMarker([lat, lon], {
                color: color,
                radius: 8,
                weight: 3,
                fillOpacity: 0.7
            }).addTo(map);

            // console.log(`htspot coords: ${spot.ssid}, Lat: ${lat}, Lon: ${lon}`);
            // const marker = L.marker([lat, lon]).addTo(map); //.bindPopup(`<b>${spot.ssid}`);

            // add an event listener (if click marker, show modal)
            circleMarker.addEventListener("click", (event) => {
                console.log("showing modal");
                showModal(spot);
            });
        }
    });
}

// fetch data and call func to place markers on map
async function loadHotspotData(url) {
    try {
        map = initMap();
        // promisfied
        const hotspots = await promiseData(url);
        markerPlace(hotspots, map); // put markers on map
        return hotspots;
    } catch (err) {
        console.error("Error loading data:", err);
    }
}




function injectHTML(list) {
    const target = document.querySelector("#results_box");
    // map is doing same as like foreach iterating through list... just at once (i found this is better time performance)
    const html = list.map((item) =>
        `<div class="output"><h3>PROVIDER: ${item.provider}</h3><p>ZIP: ${item.zip}</p></div></br>`
    ).join("");
    target.innerHTML = html;

    attachOutputListeners(list); // adding listeners to the results (for popp)
}





// FOR THE POP UP BOX
function showModal(hotspotData) {
    console.log("Modal info for... ", hotspotData.name);
    const modal = document.querySelector("#modal");
    const overlay = document.querySelector("#overlay");
    // get the ids and set content based on data.... json
    document.querySelector("#modal-title").innerHTML = `<strong>Hotspot Name:</strong> ${hotspotData.name || "N/A"}`; // some are empty for some reason?
    document.querySelector("#modal-borough").innerHTML = `<strong>Borough:</strong> ${hotspotData.boroname}`;
    document.querySelector("#modal-location").innerHTML = `<strong>Location:</strong> ${hotspotData.location}`;
    document.querySelector("#modal-zip").innerHTML = `<strong>Zip:</strong> ${hotspotData.zip}`;
    document.querySelector("#modal-access").innerHTML = `<strong>Access Type:</strong> ${hotspotData.type}`;
    document.querySelector("#modal-provider").innerHTML = `<strong>Provider:</strong> ${hotspotData.provider}`;
    document.querySelector("#modal-note").innerHTML = `<strong>Note:</strong> ${hotspotData.remarks || "N/A"}`; // some are empty so N/A

    // both modal and overlay!

    overlay.style.display = "block";

    // animate popup -- GSAP
    gsap.fromTo(modal, {
        opacity: 0,
        scale: 0.8,
    }, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
    });

    modal.style.display = "block";
    document.body.classList.add("modal-open"); // no scrolling

    // get button to close modal
    const closeModalButton = document.querySelector("#close-modal");
    // event lstneer on close buton... both modal and overlay
    closeModalButton.addEventListener("click", () => {
        // animate closing popup modal -- GSAP
        gsap.to(modal, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                // after naimation, hide model and overaly
                modal.style.display = "none";
                overlay.style.display = "none";
                document.body.classList.remove("modal-open"); // lets it scrolll again
            }
        });
    });
}


// for updating/flktering
function clearMarkers(map) {
    map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });
}


// colors for markers
function getMarkerColor(borough) {
    // each borough has a color... return it
    if (borough === 'Queens') {
        return 'red';
    } else if (borough === 'Brooklyn') {
        return 'green';
    } else if (borough === 'Manhattan') {
        return 'blue';
    } else if (borough === 'Bronx') {
        return 'yellow';
    } else if (borough === 'Staten Island') {
        return 'purple';
    } else {
        return 'gray'; // empty ones aka undefined
    }
}


// function for gsap animations to BUTTONS (like hovering ,clicking, etc.)
function animateButton(button) {
    // animation when hover into box
    button.addEventListener("mouseenter", () => {
        gsap.to(button, {
            scale: 1.05,
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            duration: 0.2,
            ease: "power1.out",
        });
    });

    // animation hoverign out of box
    button.addEventListener("mouseleave", () => {
        gsap.to(button, {
            scale: 1,
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            duration: 0.2,
            ease: "power1.in",
        });
    });

    // animation click box
    button.addEventListener("mousedown", () => {
        gsap.to(button, {
            scale: 0.95,
            duration: 0.1,
            ease: "power1.in",
        });
    });

    // orginal state animation after clicking
    button.addEventListener("mouseup", () => {
        gsap.to(button, {
            scale: 1.05,
            duration: 0.1,
            ease: "power1.out",
        });
    });
}

// function to loop through all the output boxes (under map) and addevent listerners for modal
function attachOutputListeners(list) {
    const outputs = document.querySelectorAll(".output");  // all with class ouptut
    outputs.forEach((outputItem, index) => {
        outputItem.addEventListener("click", () => {
            const hotspotData = list[index];
            console.log("hotspot:", hotspotData);
            showModal(hotspotData);
        });

        // CALL FUNCTION TO GSAP ANIMATIONS FOR BUTTONS
        animateButton(outputItem)

    });
}



// main func
async function mainEvent() {
    // map = initMap();

    const arrayJSON = await loadHotspotData(apiUrlMap);

    if (arrayJSON.length > 0) {

        // filter
        let currentArray = arrayJSON;

        injectHTML(currentArray);

        // event listner for button that scrolls to map
        viewMapButton.addEventListener("click", (event) => {
            mapContent.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });
        });

        animateButton(viewMapButton);
        animateButton(viewDatasetButton);


        // event listener for search bar... using search button
        submit.addEventListener("click", (event) => {
            event.preventDefault();
            const searchQuery = hotspotName.value.toLowerCase();
            const filteredHotspots = currentArray
                .filter((item) => {
                    const providerName = item.provider ? item.provider.toLowerCase() : "";
                    return providerName.includes(searchQuery);
                })
                .filter((item) => Boolean(item.location_lat_long));

            // filtered results and markers
            injectHTML(filteredHotspots);
            clearMarkers(map);
            markerPlace(filteredHotspots, map);
        });


        // evnet listeners for dropdown filters
        let selectedBorough, selectedAccess, selectedLocation;

        dropdownBorough.addEventListener("change", (event) => {
            selectedBorough = event.target.value;
            // console.log("selected category: ", selectedCategory);
            filterMarkers(selectedBorough, selectedAccess, selectedLocation, map, currentArray);
        });

        dropdownAccess.addEventListener("change", (event) => {
            selectedAccess = event.target.value;
            // console.log("selected category: ", selectedCategory);
            filterMarkers(selectedBorough, selectedAccess, selectedLocation, map, currentArray);
        });

        dropdownLocation.addEventListener("change", (event) => {
            selectedLocation = event.target.value;
            // console.log("selected category: ", selectedCategory);
            filterMarkers(selectedBorough, selectedAccess, selectedLocation, map, currentArray);
        });


        // eveent listener for clear button resetse
        clearFilters.addEventListener("click", (event) => {
            event.preventDefault();
            // rest filters values to default 
            dropdownBorough.value = "";
            dropdownAccess.value = "";
            dropdownLocation.value = "";
            // also reset variables for eahc
            selectedAccess = "";
            selectedBorough = "";
            selectedLocation = "";

            clearMarkers(map);
            markerPlace(currentArray, map); // show all
            injectHTML(currentArray);
            attachOutputListeners(currentArray);
        });

        // event listener for clear search
        clearSearch.addEventListener("click", (event) => {
            event.preventDefault();
            hotspotName.value = ""; // clear search input
            clearMarkers(map);
            markerPlace(currentArray, map); // show all
            injectHTML(currentArray);
            attachOutputListeners(currentArray);
        });


        // event listenre for outputs (like the map mparkers)
        attachOutputListeners(currentArray);

        window.addEventListener('resize', function () {
            const modal = document.querySelector('#modal');
            modal.style.transform = 'translate(-50%, -50%)';
        });

        
        

    }
}



document.addEventListener("DOMContentLoaded", async () => mainEvent());
