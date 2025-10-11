// ===== CONFIG =====
const apiKey = "d342be70540ded35799d0bf7b0c2a62d"; // OpenWeather API key
let map; // Google Maps instance
let marker; // single map marker
let clockTimer = null; // live clock interval tied to city
let currentUnit = "metric"; // default Celsius, can be "metric" or "imperial"

// --- internal for sun path animation control ---
let _sunPathAnimationId = null; // store requestAnimationFrame ID for sun diagram

// Track if a weather-driven sun update already happened
let _sunInitializedFromWeather = false; // flag to prevent multiple sun updates

// ===== ☀️ SUN DATA & DIAGRAM =====
async function updateSunData(lat, lon, timezoneOffsetSeconds = 0) {
  try {
    // Fetch current weather for the given coordinates to get sunrise, sunset, and timezone info
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const d = await resp.json();
    if (!resp.ok || !d.sys) throw new Error("Failed to fetch sun data");

    const sunriseUnix = d.sys.sunrise; // sunrise in UTC unix seconds
    const sunsetUnix  = d.sys.sunset;  // sunset in UTC unix seconds

    // Use provided timezone offset if valid, else use OpenWeather timezone
    const tzSec = (typeof timezoneOffsetSeconds === "number" && timezoneOffsetSeconds !== 0) ? timezoneOffsetSeconds : (d.timezone || 0);

    // Helper function to format UTC timestamp into city local time
    function fmtLocal(utcSeconds) {
      const dt = new Date((utcSeconds + tzSec) * 1000);
      const hh = dt.getUTCHours();
      const mm = dt.getUTCMinutes();
      const ampm = hh >= 12 ? "PM" : "AM";
      let h12 = hh % 12;
      if (h12 === 0) h12 = 12;
      return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
    }

    // Format sunrise, noon, and sunset times
    const sunriseStr = fmtLocal(sunriseUnix);
    const noonStr    = fmtLocal(Math.round((sunriseUnix + sunsetUnix) / 2));
    const sunsetStr  = fmtLocal(sunsetUnix);

    // Display sunrise/noon/sunset info on the page
    const infoEl = document.querySelector(".sun-info");
    if (infoEl) {
      infoEl.innerHTML = `☀️ Sunrise: ${sunriseStr} | 🌞 Noon: ${noonStr} | 🌇 Sunset: ${sunsetStr}`;
    }

    // Draw the sun path diagram using absolute UTC Date objects
    drawAdvancedSunPath(new Date(sunriseUnix * 1000), new Date(sunsetUnix * 1000));
  } catch (err) {
    console.error("Sun data error:", err);
  }
}

// Expose function globally for inline/onload usage
window.updateSunData = updateSunData;

// ===== TEMPERATURE UNIT TOGGLE =====
const unitToggle = document.getElementById("tempUnit"); // select dropdown element
if (unitToggle) {
  unitToggle.addEventListener("change", async () => {
    // Update current unit based on dropdown
    currentUnit = unitToggle.value === "imperial" ? "imperial" : "metric";

    const city = document.getElementById("cityInput").value.trim() || "Manila";
    try {
      // Fetch updated weather using new unit
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch weather");

      displayWeather(data); // Update main weather display
      get5DayForecast(city); // Update 5-day forecast
      updateOtherCitiesWeather(); // Update all other city cards
    } catch (error) {
      console.error(error);
    }
  });
}

// Tiny wrapper for inline onchange="changeUnit()" in HTML
function changeUnit() {
  if (unitToggle) unitToggle.dispatchEvent(new Event('change'));
}
window.changeUnit = changeUnit;

// ===== SEARCH WEATHER BY CITY =====
async function searchWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return alert("Please enter a city name.");

  try {
    // Fetch weather for the typed city
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`
    );
    let payload;
    try { payload = await response.json(); } catch { payload = {}; }
    if (!response.ok) {
      throw new Error(payload.message || "City not found");
    }
    displayWeather(payload); // Show main weather
    get5DayForecast(city);   // Show forecast
  } catch (error) {
    alert(error.message);
  }
}

// ====== CLICKABLE CITY CARDS FUNCTIONALITY ======
document.querySelectorAll('.city-card').forEach(card => {
  card.addEventListener('click', () => {
    const cityName = card.getAttribute('data-city');
    if (cityName) {
      document.getElementById('cityInput').value = cityName; // Update input
      searchWeather(cityName); // Trigger search
    }
  });
});

// ===== USE CURRENT LOCATION =====
async function useMyLocation() {
  if (!navigator.geolocation) return alert("Geolocation is not supported.");
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      // Fetch weather for user's coordinates
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`
      );
      let weatherData;
      try { weatherData = await weatherRes.json(); } catch { weatherData = {}; }
      if (!weatherRes.ok) {
        throw new Error(weatherData.message || "Unable to fetch weather for your location");
      }

      displayWeather(weatherData); // Show weather

      const cityName = weatherData.name || "Your location";
      get5DayForecast(cityName); // Show forecast
    } catch (error) {
      alert(error.message);
    }
  });
}

// ===== DISPLAY MAIN WEATHER DATA =====
function displayWeather(data) {
  const tempUnit = currentUnit === "metric" ? "°C" : "°F";
  const speedUnit = currentUnit === "metric" ? "km/h" : "mph";

  // City and country header
  document.querySelector(".city-country-header h1").textContent =
    `${data.name}, ${data.sys.country}`;

  // Left column: temperature and weather description
  document.querySelector(".left-column h3").textContent = `${Math.round(data.main.temp)}${tempUnit}`;
  document.querySelector(".left-column p:nth-of-type(2)").textContent =
    capitalizeFirstLetter(data.weather[0].description);

  // Weather icon
  const iconCode = data.weather[0].icon.toLowerCase();
  document.querySelector(".left-column img").src =
    `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.querySelector(".left-column img").alt = data.weather[0].description;

  // Right column: humidity, wind, feels like, visibility, UV
  document.querySelector(".right-column p:nth-of-type(1)").textContent =
    `Humidity: ${data.main.humidity}%`;

  const windSpeed = currentUnit === "metric" ? (data.wind.speed * 3.6).toFixed(1) : data.wind.speed.toFixed(1);
  document.querySelector(".right-column p:nth-of-type(2)").textContent =
    `Wind Speed: ${windSpeed} ${speedUnit}`;
  document.querySelector(".right-column p:nth-of-type(3)").textContent =
    `Feels Like: ${Math.round(data.main.feels_like)}${tempUnit}`;
  document.querySelector(".right-column p:nth-of-type(4)").textContent =
    `UV Index: N/A`;
  document.querySelector(".right-column p:nth-of-type(5)").textContent =
    `Visibility: ${(data.visibility / 1000).toFixed(1)} km`;

  // Start live clock
  if (typeof data.dt === "number" && typeof data.timezone === "number") {
    startClockFromDt(data.dt, data.timezone);
  }

  // Update map and sun diagram if coordinates exist
  if (data.coord && typeof data.coord.lat === "number" && typeof data.coord.lon === "number") {
    updateMap(data.coord.lat, data.coord.lon);
    updateSunData(data.coord.lat, data.coord.lon, data.timezone); // pass timezone
    _sunInitializedFromWeather = true;
  }
}

// ===== 5-DAY FORECAST =====
async function get5DayForecast(city) {
  try {
    // Fetch forecast data
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`
    );
    if (!response.ok) throw new Error("Failed to load 5-day forecast");

    const data = await response.json();
    const forecastBox = document.querySelector(".forecast-box");
    forecastBox.innerHTML = "";

    // Only pick forecast at 12:00 PM each day
    const dailyForecasts = data.list.filter(f => f.dt_txt.includes("12:00:00"));
    const tempUnit = currentUnit === "metric" ? "°C" : "°F";

    dailyForecasts.slice(0, 5).forEach(f => {
      const date = new Date(f.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(f.main.temp);
      const iconCode = f.weather[0].icon.toLowerCase();
      const icon = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      const dayDiv = document.createElement("div");
      dayDiv.classList.add("day");
      dayDiv.innerHTML = `${dayName}<br>${temp}${tempUnit}<br><img src="${icon}" width="50" alt="${f.weather[0].description}">`;

      forecastBox.appendChild(dayDiv);
    });
  } catch (error) {
    console.error(error);
    alert("Failed to load 5-day forecast. Please try again.");
  }
}
// ===== GOOGLE MAPS =====
// Initialize Google Map at a default location or provided lat/lon
function initMap(lat = 14.5995, lon = 120.9842) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng: lon }, // set map center
    zoom: 8, // default zoom level
  });

  // Place a marker on the map
  marker = new google.maps.Marker({
    position: { lat, lng: lon },
    map: map,
    title: "Current Location", // tooltip text
  });
}

// Update map center and marker for a new location
function updateMap(lat, lon) {
  if (!map) return initMap(lat, lon); // initialize if not yet created

  map.setCenter({ lat, lng: lon }); // move map center
  map.setZoom(8); // ensure zoom

  if (marker) {
    marker.setPosition({ lat, lng: lon }); // move existing marker
    marker.setTitle("Selected Location"); // update tooltip
  } else {
    // create marker if missing
    marker = new google.maps.Marker({
      position: { lat, lng: lon },
      map: map,
      title: "Selected Location",
    });
  }
}

// ===== HELPER =====
// Capitalizes the first letter of a string
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== THEME TOGGLE =====
const themeToggleBtn = document.getElementById("theme-toggle");
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode"); // toggle class

  if (document.body.classList.contains("light-mode")) {
    // Set CSS variables for light mode
    themeToggleBtn.textContent = "🌙 Dark Mode";
    document.documentElement.style.setProperty('--bg-color', '#f4f4f4');
    document.documentElement.style.setProperty('--text-color', '#1a2a35');
    document.documentElement.style.setProperty('--card-bg', '#ffffff');
    document.documentElement.style.setProperty('--accent-color', '#3498db');
    document.documentElement.style.setProperty('--border-color', '#ccc');
  } else {
    // Set CSS variables for dark mode
    themeToggleBtn.textContent = "🌙 Dark Mode";
    document.documentElement.style.setProperty('--bg-color', '#1a2a35');
    document.documentElement.style.setProperty('--text-color', '#e0e0e0');
    document.documentElement.style.setProperty('--card-bg', '#223340');
    document.documentElement.style.setProperty('--accent-color', '#3498db');
    document.documentElement.style.setProperty('--border-color', '#3f5160');
  }
});

// ===== OTHER CITIES WEATHER =====
async function updateOtherCitiesWeather() {
  const cityCards = document.querySelectorAll(".city-card");

  for (const card of cityCards) {
    const cityName = card.getAttribute("data-city");
    if (!cityName) continue; // skip if no city name

    try {
      // Fetch weather for each city card
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=${currentUnit}`
      );
      if (!response.ok) throw new Error(`Failed to fetch weather for ${cityName}`);
      const data = await response.json();

      const tempUnit = currentUnit === "metric" ? "°C" : "°F";

      // Update card elements: temp, description, icon
      const tempEl = card.querySelector(".temp");
      const weatherEl = card.querySelector(".weather");
      const iconImg = card.querySelector(".weather-icon");

      if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
      if (weatherEl) weatherEl.textContent = capitalizeFirstLetter(data.weather[0].description);
      if (iconImg) {
        const iconCode = data.weather[0].icon.toLowerCase();
        iconImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconImg.alt = data.weather[0].description;
        iconImg.style.display = "inline-block";
      }

      // Update city clock
      const clockEl = card.querySelector(".city-time");
      if (clockEl && typeof data.dt === "number" && typeof data.timezone === "number") {
        if (clockEl.clockTimer) clearInterval(clockEl.clockTimer); // stop previous interval

        const tick = () => {
          const cityTimeMs = (Date.now() + (data.timezone * 1000) - (new Date().getTimezoneOffset() * 60000));
          const t = new Date(cityTimeMs);

          let h = t.getUTCHours();
          const m = t.getUTCMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          h = h % 12 || 12;

          clockEl.textContent = `${h}:${String(m).padStart(2, "0")} ${ampm}`;
        };

        tick();
        clockEl.clockTimer = setInterval(tick, 1000); // update every second
      }

    } catch (error) {
      console.error(error);
      // fallback UI on error
      const tempEl = card.querySelector(".temp");
      const weatherEl = card.querySelector(".weather");
      const iconImg = card.querySelector(".weather-icon");
      const clockEl = card.querySelector(".city-time");

      if (tempEl) tempEl.textContent = "--";
      if (weatherEl) weatherEl.textContent = "N/A";
      if (iconImg) iconImg.style.display = "none";
      if (clockEl) {
        clockEl.textContent = "--:--";
        if (clockEl.clockTimer) clearInterval(clockEl.clockTimer);
      }
    }
  }
}

// Initialize other cities weather after DOM loaded
document.addEventListener("DOMContentLoaded", updateOtherCitiesWeather);

// ===== SIDEBAR NAV INTERACTION =====
const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active')); // remove active from all
    link.classList.add('active'); // set clicked link active

    const targetText = link.textContent.trim();
    if (targetText === "🏠 Home") window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (targetText === "🌦️ Forecast") {
      document.querySelector('.forecast-container').scrollIntoView({ behavior: 'smooth' });
    }
    else if (targetText === "🗺️ Map") {
      document.querySelector('.weather-map-container').scrollIntoView({ behavior: 'smooth' });
    }
    else if (targetText === "📍 Locations") {
      document.querySelector('.other-cities-container').scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== UTILS: Canvas prepare for high DPI & responsive sizes =====
function prepareCanvasForDraw(canvas) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));

  // Reuse if dimensions unchanged
  if (canvas._lastCssW === cssW && canvas._lastCssH === cssH && canvas._lastDpr === dpr) {
    return { cssW, cssH, ctx: canvas.getContext('2d'), dpr };
  }

  // Set element CSS size (keeps layout) and backing store to device pixel ratio
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels

  canvas._lastCssW = cssW;
  canvas._lastCssH = cssH;
  canvas._lastDpr = dpr;

  return { cssW, cssH, ctx, dpr };
}

// ===== ADVANCED SUN PATH DRAWING =====
function drawAdvancedSunPath(sunriseUTC, sunsetUTC) {
  const canvas = document.getElementById("sunPathCanvas");
  if (!canvas) return;

  // Cancel previous animation if exists
  if (_sunPathAnimationId) {
    cancelAnimationFrame(_sunPathAnimationId);
    _sunPathAnimationId = null;
  }

  function render() {
    const prepared = prepareCanvasForDraw(canvas);
    if (!prepared) return;
    const { cssW: width, cssH: height, ctx } = prepared;

    // Determine radius and center for sun arc
    const padding = Math.max(12, Math.round(width * 0.03));
    const maxRadiusW = (width - padding * 2) / 2;
    const maxRadiusH = (height - padding * 2) / 2;
    let radius = Math.min(maxRadiusW, maxRadiusH);
    radius = Math.max(10, Math.floor(radius * 0.88));
    const centerX = width / 2;
    let baseY = Math.round(height / 2 + radius * 0.35);
    baseY = Math.min(height - padding, Math.max(padding + radius, baseY));

    ctx.clearRect(0, 0, width, height); // clear previous frame

    // Sky gradient based on theme
    const isLightMode = document.body.classList.contains("light-mode");
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isLightMode) {
      skyGradient.addColorStop(0, "#87CEFA");
      skyGradient.addColorStop(0.7, "#B0E0E6");
      skyGradient.addColorStop(1, "#fffacd");
    } else {
      skyGradient.addColorStop(0, "#1a2a35");
      skyGradient.addColorStop(0.7, "#223340");
      skyGradient.addColorStop(1, "#445566");
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw baseline
    ctx.beginPath();
    ctx.moveTo(padding, baseY);
    ctx.lineTo(width - padding, baseY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = isLightMode ? "#888" : "#bbb";
    ctx.stroke();

    // Draw sun arc
    ctx.beginPath();
    ctx.arc(centerX, baseY, radius, Math.PI, 0, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FFD700";
    ctx.stroke();

    // Calculate sun position
    const nowMs = Date.now();
    const sunriseMs = (sunriseUTC instanceof Date) ? sunriseUTC.getTime() : new Date(sunriseUTC).getTime();
    const sunsetMs  = (sunsetUTC instanceof Date) ? sunsetUTC.getTime()  : new Date(sunsetUTC).getTime();
    let totalDuration = sunsetMs - sunriseMs;
    if (totalDuration <= 0) totalDuration += 24 * 3600 * 1000;
    let elapsed = nowMs - sunriseMs;
    if (elapsed < 0) elapsed += 24 * 3600 * 1000;
    elapsed = Math.max(0, Math.min(elapsed, totalDuration));
    const progress = totalDuration > 0 ? (elapsed / totalDuration) : 0;

    const angle = Math.PI * (1 - progress);
    const sunX = centerX + radius * Math.cos(angle);
    const sunY = baseY - radius * Math.sin(angle);

    // Draw sun with radial gradient
    const sunRadius = Math.max(6, Math.round(radius * 0.12));
    const sunGradient = ctx.createRadialGradient(sunX, sunY, Math.max(1, sunRadius * 0.2), sunX, sunY, sunRadius * 2);
    if (isLightMode) {
      sunGradient.addColorStop(0, "#FFFACD");
      sunGradient.addColorStop(1, "rgba(255,215,0,0.35)");
    } else {
      sunGradient.addColorStop(0, "#FFE066");
      sunGradient.addColorStop(1, "rgba(255,165,0,0.35)");
    }
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw labels
    ctx.fillStyle = isLightMode ? "#333" : "#eee";
    ctx.font = `${Math.max(10, Math.round(radius * 0.12))}px Arial`;
    ctx.textBaseline = "top";
    const sunriseLabelX = Math.max(6, Math.round(centerX - radius - 6));
    const sunsetLabelX  = Math.min(width - 60, Math.round(centerX + radius - 30));
    ctx.fillText("Sunrise", sunriseLabelX, baseY + 8);
    ctx.fillText("Sunset", sunsetLabelX, baseY + 8);

    // Loop animation
    _sunPathAnimationId = requestAnimationFrame(render);
  }

  render();
}

// expose drawing function globally
window.drawAdvancedSunPath = drawAdvancedSunPath;

// ===== LIVE CLOCK =====
function startClockFromDt(dtUnix, timezoneOffsetSeconds) {
  if (clockTimer) clearInterval(clockTimer);

  const serverDiffMs = (typeof dtUnix === "number") ? (dtUnix * 1000 - Date.now()) : 0;

  function tick() {
    const nowCorrectedMs = Date.now() + serverDiffMs;
    const cityLocalMs = nowCorrectedMs + (timezoneOffsetSeconds * 1000);
    const t = new Date(cityLocalMs);

    let h = t.getUTCHours();
    const m = t.getUTCMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    const clockEl = document.querySelector(".main-city-clock");
    if (clockEl) clockEl.textContent = `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  tick();
  clockTimer = setInterval(tick, 1000);
}

// ===== DOMCONTENTLOADED: INITIALIZE SUN IF NO WEATHER YET =====
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (!_sunInitializedFromWeather) {
      updateSunData(14.5995, 120.9842, 0); // Manila default
    }
  }, 0);
});

// ===== DOMCONTENTLOADED: CREATE SUN CANVAS IF MISSING =====
document.addEventListener("DOMContentLoaded", () => {
  const existing = document.getElementById("sunPathCanvas");
  if (existing) {
    const info = document.querySelector(".sun-info");
    if (info && !info.textContent.trim()) info.textContent = "Loading sun data...";
    return;
  }
  const container = document.querySelector(".weather-map-container");
  if (container) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("sunpath-wrapper");
    wrapper.innerHTML = `
      <h3 style="text-align:center;margin-bottom:8px;">☀️ Sun Path Diagram</h3>
      <canvas id="sunPathCanvas" width="400" height="200" style="border:1px solid #ccc; display:block; margin:0 auto;"></canvas>
      <p class="sun-info" style="text-align:center; margin-top:5px;">Loading sun data...</p>
    `;
    container.appendChild(wrapper);
  }
});

// ===== WEATHER ALERTS =====
async function updateWeatherAlerts(lat, lon) {
  const alertEl = document.getElementById("weatherAlert");
  if (!alertEl) return;

  try {
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${apiKey}`);
    const data = await resp.json();

    if (data.alerts && data.alerts.length > 0) {
      const alertMessages = data.alerts.map(a => `${a.event} - ${a.severity || "Moderate"}`).join(", ");
      alertEl.textContent = `Ongoing: ${alertMessages}`;
    } else {
      alertEl.textContent = "No ongoing weather alerts.";
    }
  } catch (err) {
    console.error("Weather alerts error:", err);
    alertEl.textContent = "Unable to load alerts.";
  }
}
