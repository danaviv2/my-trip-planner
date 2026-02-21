export const fetchWeatherForecast = async (destination) => {
  // סימולציה של קריאת API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        location: destination,
        locationHebrew: destination,
        temp: 22,
        feels_like: 23,
        temp_min: 18,
        temp_max: 25,
        humidity: 65,
        description: 'שמיים בהירים',
        icon: '01d',
        windSpeed: 3.5,
      });
    }, 500);
  });
};

export const fetchGeoInfo = async (destination) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: destination,
        nameLocal: destination,
        temp: 22,
        description_weather: 'שמיים בהירים',
      });
    }, 500);
  });
};
