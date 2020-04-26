const axios = require('axios');

const { GOOGLE_MAPS_API_KEY } = process.env;

const getDistanceMatrix = (query) => {
  const { destination, origin, waypoints } = query;
  const newWaypoints = waypoints.trim().split(',').filter(waypoint => waypoint);
  if (!newWaypoints.length) {
    return axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}`)
      .then(response => ({
        distance: response.data.rows[0].elements[0].distance.text,
        duration: response.data.rows[0].elements[0].duration.text,
      }));
  }
  newWaypoints.unshift(origin);
  newWaypoints.push(destination);
  const etaForAllStops = newWaypoints.slice(0, newWaypoints.length - 1).map((waypoint, i) => axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${waypoint}&destinations=${newWaypoints[i + 1]}&key=${GOOGLE_MAPS_API_KEY}`)
    .then(response => ({
      distance: response.data.rows[0].elements[0].distance.text,
      duration: response.data.rows[0].elements[0].duration.text,
    })));
  return Promise.all(etaForAllStops).then((etas) => {
    const etaDurations = etas.map(eta => eta.duration);
    const addAlltheElements = arr => arr.reduce((a, b) => a + b, 0);
    let dayDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('day')).map(eta => Number(eta.split('day')[0].trim()) * 2));
    let hourDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('hour')).map((eta) => {
      let hour = eta.split('hour')[0].trim();
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(hour)) {
        hour = hour.split('day')[1].slice(1).trim();
      }
      return Number(hour);
    }));
    let minsDuration = addAlltheElements(etaDurations.filter(eta => eta.includes('min')).map((eta) => {
      let mins = eta.split('min')[0].trim();
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(mins)) {
        mins = mins.split('hour')[1].slice(1).trim();
      }
      return Number(mins);
    }));
    if (hourDuration >= 24) {
      dayDuration += parseInt(hourDuration / 24, 10);
      hourDuration %= 24;
    }
    if (minsDuration >= 60) {
      hourDuration += parseInt(minsDuration / 60, 10);
      minsDuration %= 60;
    }
    dayDuration = dayDuration ? `${dayDuration} ${dayDuration > 1 ? 'days' : 'day'}` : '';
    hourDuration = hourDuration ? `${hourDuration} ${hourDuration > 1 ? 'hours' : 'hour'}` : '';
    minsDuration = minsDuration ? `${minsDuration} ${minsDuration > 1 ? 'mins' : 'min'}` : '';

    const duration = `${dayDuration} ${hourDuration} ${minsDuration}`;
    const distance = `${addAlltheElements(etas.map(eta => Number(eta.distance.slice(0, eta.distance.length - 3).replace(/,/g, ''))))} mi`;
    return { duration, distance };
  })
    .catch(err => console.error(err));
};


module.exports.getDistanceMatrix = getDistanceMatrix;
