const { orderBy, isEmpty, find } = require('../utils');
const RefreshableResourceMixin = require('./RefreshableResourceMixin');
const { OneHourSeconds, OneDaySeconds, OneWeekSeconds } = require('../utils');
const Resource = require('./Resource');
const Zone = require('./Zone');
const FlexScheduleRule = require('./FlexScheduleRule');
const ScheduleRule = require('./ScheduleRule');
const Forecast = require('./Forecast');
const CurrentSchedule = require('./CurrentSchedule');
const CurrentConditions = require('./CurrentConditions');
const Event = require('./Event');

class Device extends Resource {
  constructor(dataStore, data) {
    super('device/{id}', dataStore, data, { zones: Zone, flexScheduleRules: FlexScheduleRule, scheduleRules: ScheduleRule });
    this._Forecast = new Forecast(dataStore);
    this._Zone = new Zone(dataStore);
    this._CurrentSchedule = new CurrentSchedule(dataStore);
    this._CurrentConditions = new CurrentConditions(dataStore);
    this._Event = new Event(dataStore);
    this._refreshArgs = [{ id: this.id }];
  }

  getZones() {
    return this.refresh()
      .then(({ zones }) => zones)
      .then(zones => orderBy(zones, 'zoneNumber'));
  }

  getActiveZone() {
    return this.getCurrentSchedule()
      .then(({ zoneId }) =>
        (isEmpty(zoneId)
          ? false
          : this._Zone.get({ id: zoneId })));
  }

  isWatering() {
    return this.getCurrentSchedule()
      .then(({ zoneId }) => zoneId !== undefined);
  }

  getCurrentConditions(units) {
    return this._CurrentConditions.get({ deviceId: this.id }, units);
  }

  isRaining() {
    return this.getCurrentConditions()
      .then(({ precipProbability }) => precipProbability >= 0.99);
  }

  getForecast(startTime, endTime, units) {
    return this._Forecast.get({ deviceId: this.id }, startTime, endTime, units);
  }

  getForecastToday(units) {
    return this._Forecast.getToday({ deviceId: this.id }, units);
  }

  getForecastTomorrow(units) {
    return this._Forecast.getTomorrow({ deviceId: this.id }, units);
  }

  getForecastNextRain(probabilityThreshold = 0.25, units) {
    return this._Forecast.get({ deviceId: this.id }, undefined, undefined, units)
      .then(days =>
        find(days, ({ precipProbability }) => precipProbability >= probabilityThreshold))
      .then(days => days || false);
  }

  getEvents(startTime, endTime, filters) {
    return this._Event.get({ deviceId: this.id }, startTime, endTime, filters);
  }

  getCurrentSchedule() {
    return this._CurrentSchedule.get({ deviceId: this.id });
  }

  stopWater() {
    return this._dataStore.put('device/stop_water', { id: this.id });
  }

  standbyOff() {
    return this._dataStore.put('device/on', { id: this.id });
  }

  standbyOn() {
    return this._dataStore.put('device/off', { id: this.id });
  }

  rainDelay(duration = OneDaySeconds) {
    if (duration > OneWeekSeconds) return Promise.reject(new Error('Maximum rain delay of One Week'));
    if (duration < 0) return Promise.reject(new Error('Minimum rain delay of 0 seconds'));
    return this._dataStore.put('device/rain_delay', { id: this.id, duration });
  }

  rainDelayCancel() {
    return this.rainDelay(0);
  }

  pauseZoneRun(duration = OneHourSeconds) {
    if (duration > OneHourSeconds) return Promise.reject(new Error('Maximum zone pause of One Hour'));
    if (duration < 0) return Promise.reject(new Error('Minimum zone pause of 0 seconds'));
    return this._dataStore.put('device/pause_zone_run', { id: this.id, duration });
  }

  resumeZoneRun() {
    return this._dataStore.put('device/resume_zone_run', { id: this.id });
  }
}

module.exports = RefreshableResourceMixin(Device);
