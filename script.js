const LocationEl = document.querySelector(".location");
const RadiusEl = document.querySelector(".radius");
const GenerateEl = document.querySelector(".generate");
const ButtonLess = document.querySelector(".btnLess");
const ButtonMore = document.querySelector(".btnMore");
const MoreEl = document.querySelector(".more");
const LessEl = document.querySelector(".less");
const DetailedElements = MoreEl.children;
const ApiKeyEl = document.querySelector(".api_key");
const ErrMsgEl = document.querySelector(".api_err");
const MapEl = document.querySelector(".osm_map");
const map = L.map(MapEl);
const markerLayer = L.layerGroup().addTo(map);

let detailed = false;

// Listeners 

GenerateEl.addEventListener("click", GetCoordinates);

ButtonMore.addEventListener("click", () => {
    MoreEl.style.display = "grid";  
    LessEl.style.display = "none";  
    detailed = true;
});

ButtonLess.addEventListener("click", () => {
    MoreEl.style.display = "none";   
    LessEl.style.display = "grid";  
    detailed = false;
});

window.addEventListener("load", () => {
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
})

async function GetCoordinates() {
    const key = ApiKeyEl.value;
    if(!key) {
        await error("Please provide the API key!");
        return;
    }
    const loc = LocationEl.value;
    const radius = RadiusEl.value;
    let coordinates = [];

    // Getting geocoded coordinates 
    if (!detailed) {
        coordinates = await QueryCoordinates(`https://geocode.maps.co/search?q=${encodeURIComponent(loc)}&format=geojson&limit=1&addressdetails=0&api_key=${key}`); 
    } else {
        const params = new URLSearchParams();

        for(let el of DetailedElements) {
            if(el.value.trim() !== "") {
                params.append(el.className, el.value);
            }
        }

        params.append("format", "geojson");
        params.append("limit", "1");
        params.append("addressdetails", "0");
        coordinates = await QueryCoordinates(`https://geocode.maps.co/search?${params.toString()}&api_key=${key}`);
    }
    
    // Sanity check
    if (coordinates.length == 0) {
        await error("Error fetching coordinates");
        return;
    }
    else console.log(coordinates);
    if (radius <= 0 || isNaN(radius)) {
        await error("Invalid radius");
        return;
    }

    // Converting km to degrees
    const {dx, dy} = GetRandomPoint(radius);
    const {degX, degY} = ToDegrees(dx, dy, coordinates[1]);
    const newX = coordinates[0] + degX;
    const newY = coordinates[1] + degY;

    console.log(`Was: x = ${coordinates[0]}, y = ${coordinates[1]}`);
    console.log(`Became: x = ${newX}, y = ${newY}`);
    MapEl.style.display = "block";
    map.invalidateSize();
    addMap(newX, newY);
}

// Methods to generate the coordinates

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function error(message) {
    alert(message);
    ErrMsgEl.innerText = message; 
    ErrMsgEl.style.display = "block";
    await sleep(3000);
    ErrMsgEl.style.display = "none";
    ErrMsgEl.innerText = "";
    return;
}

function addMap(x, y) {
    var target = L.latLng(y, x); 
    map.setView(target, 10);
    markerLayer.clearLayers();
    L.marker(target).addTo(markerLayer);
}

async function QueryCoordinates(query) {
    try {
        const response = await fetch(query);
        const data = await response.json();
        if(data.features.length != 0) {
            const coordinates = data.features[0].geometry.coordinates;
            return coordinates;
        } else {
            return [];
        }
    } catch (err) {
        console.log("Error fetching: ", err);
        return [];
    }
}

function GetRandomPoint(radius) {
    let angle = Math.random()*Math.PI*2;
    let dx = Math.cos(angle) * radius;
    let dy = Math.sin(angle) * radius;
    console.log(`dx = ${dx}, dy = ${dy}, radius = ${Math.sqrt(dx**2 + dy**2)}`);
    return {"dx": dx, "dy": dy};
}

function ToDegrees(x, y, xpos) {
    let degY = y/111.320;
    let degX = x/(111.320*Math.cos((xpos*Math.PI)/180));
    return {"degX": degX, "degY": degY};
}
