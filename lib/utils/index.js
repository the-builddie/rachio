const moment = require('moment');
const lodashFns = require('./lodashModules');

const replaceChars = {
  '\n': '\\n',
  '"': '\\"',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

const cleanRegex = new RegExp(`[${Object.keys(replaceChars).join('')}]`, 'g');
const interpolateRegex = /\{([\s\S]+?)\}/g;

const UrlInterpolator = (str) => {
  const cleanString = str.replace(cleanRegex, $0 => replaceChars[$0]);
  return outputs => cleanString.replace(interpolateRegex, ($0, $1) => encodeURIComponent(outputs[$1] || ''));
};

const AddTime = (start, amount, unit) =>
  (start !== 0 && start ? moment(start).add(amount, unit).valueOf() : null);

const StartOfDay = now => moment(now).startOf('day').valueOf();
const EndOfDay = now => moment(now).endOf('day').valueOf();

const OneHourSeconds = 3600;
const OneDaySeconds = 86400;
const OneWeekSeconds = 604800;

const Filter = criteria =>
  (!lodashFns.isFunction(criteria) && lodashFns.isEmpty(criteria)
    ? arr => arr
    : arr => lodashFns.filter(arr, criteria));

const FilterPropertyBetween = (prop,
  lowerBound = Number.NEGATIVE_INFINITY,
  upperBound = Number.POSITIVE_INFINITY) =>
  Filter((f) => {
    const val = lodashFns.get(f, prop, 0);
    return val >= lowerBound && val < upperBound;
  });

module.exports = Object.assign({
  UrlInterpolator,
  AddTime,
  StartOfDay,
  EndOfDay,
  FilterPropertyBetween,
  Filter,
  OneHourSeconds,
  OneDaySeconds,
  OneWeekSeconds,
}, lodashFns);
