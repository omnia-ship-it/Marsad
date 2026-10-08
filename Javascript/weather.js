async function getWeatherData() {
    var weatherApiCity = 'Asyut'

    // Step 1: turn the city name into coordinates (Open-Meteo Geocoding API, no key needed)
    var geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherApiCity)}&count=1`
    var geoResponse = await fetch(geoUrl)
    var geoData = await geoResponse.json()
    var location = geoData.results[0]

    // Step 2: get the current weather for those coordinates (Open-Meteo Forecast API, no key needed)
    var weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`
    var response = await fetch(weatherUrl)
    var data = await response.json()

    var condition = getWeatherCondition(data.current_weather.weathercode)

    document.querySelector('#temp .ki-weather-icon').innerText = condition.emoji
    document.querySelector('#temp .ki-weather-icon').setAttribute('title', condition.text)
    document.querySelector('#temp h2').innerHTML = `${Math.round(data.current_weather.temperature)}&deg; C`
    document.querySelector('#temp h3').innerText = location.name
    // console.log(data);
}

// Open-Meteo returns a numeric "weather code" (WMO standard) instead of an icon URL,
// so we map the common codes to an emoji + short description ourselves.
function getWeatherCondition($code) {
    var conditions = {
        0: { emoji: '☀️', text: 'Clear sky' },
        1: { emoji: '🌤️', text: 'Mainly clear' },
        2: { emoji: '⛅', text: 'Partly cloudy' },
        3: { emoji: '☁️', text: 'Overcast' },
        45: { emoji: '🌫️', text: 'Fog' },
        48: { emoji: '🌫️', text: 'Fog' },
        51: { emoji: '🌦️', text: 'Light drizzle' },
        53: { emoji: '🌦️', text: 'Drizzle' },
        55: { emoji: '🌧️', text: 'Dense drizzle' },
        61: { emoji: '🌧️', text: 'Slight rain' },
        63: { emoji: '🌧️', text: 'Rain' },
        65: { emoji: '🌧️', text: 'Heavy rain' },
        71: { emoji: '🌨️', text: 'Slight snow' },
        73: { emoji: '🌨️', text: 'Snow' },
        75: { emoji: '❄️', text: 'Heavy snow' },
        80: { emoji: '🌦️', text: 'Rain showers' },
        81: { emoji: '🌧️', text: 'Rain showers' },
        82: { emoji: '⛈️', text: 'Violent showers' },
        95: { emoji: '⛈️', text: 'Thunderstorm' },
        96: { emoji: '⛈️', text: 'Thunderstorm with hail' },
        99: { emoji: '⛈️', text: 'Thunderstorm with hail' }
    }
    return conditions[$code] || { emoji: '🌡️', text: 'Unknown' }
}
