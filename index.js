let apiKey = "d342be70540ded35799d0bf7b0c2a62d"; // your API key

// Get city coordinates
async function getCityCoordinates(city) {
  let url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
  try {
    let response = await fetch(url);
    let data = await response.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

// Weather by city
async function getWeatherByCity(city) {
  document.getElementById("result").innerHTML = "⏳ Fetching weather...";
  let coords = await getCityCoordinates(city);
  if (!coords) {
    document.getElementById("result").innerHTML = "❌ City not found!";
    document.getElementById("forecast").innerHTML = "";
    return;
  }

  let url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

  try {
    let response = await fetch(url);
    let data = await response.json();

    if (data.cod === 200) {
      displayWeather(data, coords.name, coords.country);
      getForecast(coords.lat, coords.lon);
    } else {
      document.getElementById("result").innerHTML = "❌ Weather not available!";
      document.getElementById("forecast").innerHTML = "";
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    document.getElementById("result").innerHTML = "⚠️ Error fetching data.";
    document.getElementById("forecast").innerHTML = "";
  }
}

// Weather by coordinates
async function getWeatherByCoords(lat, lon) {
  document.getElementById("result").innerHTML = "⏳ Fetching weather...";
  let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    let response = await fetch(url);
    let data = await response.json();
    displayWeather(data, data.name, data.sys.country);
    getForecast(lat, lon);
  } catch (error) {
    console.error("Error fetching weather:", error);
    document.getElementById("result").innerHTML = "⚠️ Error fetching data.";
    document.getElementById("forecast").innerHTML = "";
  }
}

// 5-day forecast
async function getForecast(lat, lon) {
  document.getElementById("forecast").innerHTML = "⏳ Fetching forecast...";
  let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    let response = await fetch(url);
    let data = await response.json();

    if (data.cod === "200") {
      let forecastHTML = "<h3>5-Day Forecast</h3>";
      for (let i = 0; i < data.list.length; i += 8) {
        let day = data.list[i];
        let date = new Date(day.dt * 1000).toLocaleDateString();
        forecastHTML += `
          <div style="margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:8px; background:#f9f9f9;">
            📅 <b>${date}</b><br>
            🌡️ Temp: ${day.main.temp} °C<br>
            🌥️ ${day.weather[0].description}<br>
            💧 Humidity: ${day.main.humidity}%
          </div>
        `;
      }
      document.getElementById("forecast").innerHTML = forecastHTML;
    } else {
      document.getElementById("forecast").innerHTML = "❌ Forecast not available.";
    }
  } catch (error) {
    console.error("Error fetching forecast:", error);
    document.getElementById("forecast").innerHTML = "⚠️ Error fetching forecast.";
  }
}

//Weather Map Logic
  let map;
  const OPENWEATHER_API_KEY = "a62df522aa28b32081cb8a08ce32f420"; // replace with your own OpenWeatherMap key

  function initMap() {
    // Initialize the base map
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 14.5995, lng: 120.9842 }, // Manila by default
      zoom: 5,
    });

    // Define the base URL pattern for OpenWeatherMap tiles
    const baseUrl = "https://tile.openweathermap.org/map/";

    // Define each weather layer
    const layers = {
      temperature: new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => 
          `${baseUrl}temp_new/${zoom}/${coord.x}/${coord.y}.png?appid=a62df522aa28b32081cb8a08ce32f420`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.6,
      }),
      clouds: new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => 
          `${baseUrl}clouds_new/${zoom}/${coord.x}/${coord.y}.png?appid=a62df522aa28b32081cb8a08ce32f420`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.6,
      }),
      precipitation: new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => 
          `${baseUrl}precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=a62df522aa28b32081cb8a08ce32f420`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.6,
      }),
      wind: new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => 
          `${baseUrl}wind_new/${zoom}/${coord.x}/${coord.y}.png?appid=a62df522aa28b32081cb8a08ce32f420`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.6,
      }),
      pressure: new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => 
          `${baseUrl}pressure_new/${zoom}/${coord.x}/${coord.y}.png?appid=a62df522aa28b32081cb8a08ce32f420`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.6,
      }),
    };

    // Add the default layer (temperature)
    map.overlayMapTypes.insertAt(0, layers.temperature);

    // Optional: simple controls to switch layers
    const controlDiv = document.createElement("div");
    controlDiv.innerHTML = `
      <div style="background:#fff;padding:8px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        <strong>Weather Layers:</strong><br>
        <select id="layerSelector">
          <option value="temperature">Temperature</option>
          <option value="clouds">Clouds</option>
          <option value="precipitation">Precipitation</option>
          <option value="wind">Wind</option>
          <option value="pressure">Pressure</option>
        </select>
      </div>
    `;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

    // Switch layer when user selects a different option
    document.getElementById("layerSelector").addEventListener("change", (e) => {
      map.overlayMapTypes.clear();
      map.overlayMapTypes.insertAt(0, layers[e.target.value]);
    });
  }


// Display weather
function displayWeather(data, cityName, countryCode) {
  document.getElementById("result").innerHTML = `
    <h3>${cityName}, ${countryCode}</h3>
    🌡️ Temp: ${data.main.temp} °C <br>
    🤔 Feels Like: ${data.main.feels_like} °C <br>
    🌥️ Weather: ${data.weather[0].description} <br>
    💧 Humidity: ${data.main.humidity}% <br>
    🌬️ Wind Speed: ${data.wind.speed} m/s
  `;
}

// Button click
function searchWeather() {
  let city = document.getElementById("cityInput").value;
  if (city) {
    document.getElementById("forecast").innerHTML = "";
    getWeatherByCity(city);
  } else {
    document.getElementById("result").innerHTML = "⚠️ Please enter a city.";
    document.getElementById("forecast").innerHTML = "";
  }
}

// Use my location
function useMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
      },
      () => {
        document.getElementById("result").innerHTML =
          "⚠️ Location access denied. Please search manually.";
        document.getElementById("forecast").innerHTML = "";
      }
    );
  } else {
    document.getElementById("result").innerHTML =
      "⚠️ Geolocation not supported by your browser.";
    document.getElementById("forecast").innerHTML = "";
  }
}
// Theme toggle     
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  let isDarkMode = true;

  themeToggle.addEventListener('click', () => {
    if (isDarkMode) {
      // Switch to light mode
      root.style.setProperty('--bg-color', '#f4f6f8');
      root.style.setProperty('--text-color', '#1a1a1a');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--border-color', '#cccccc');
      themeToggle.textContent = '☀️ Light Mode';
    } else {
      // Switch back to dark mode
      root.style.setProperty('--bg-color', '#1a2a35');
      root.style.setProperty('--text-color', '#e0e0e0');
      root.style.setProperty('--card-bg', '#223340');
      root.style.setProperty('--border-color', '#3f5160');
      themeToggle.textContent = '🌙 Dark Mode';
    }
    isDarkMode = !isDarkMode;
  });

  //collapse sidebar
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-btn');
  const themeBtn = document.getElementById('theme-btn');

  // Collapse Sidebar
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Toggle Dark/Light Mode
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
      themeBtn.textContent = '🌞 Light Mode';
    } else {
      themeBtn.textContent = '🌙 Dark Mode';
    }
  });



// Auto location on load
window.onload = function () {
  useMyLocation();
};

