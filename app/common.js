module.exports.timeSince = (date) => {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval, subInterval;

  interval = Math.floor(seconds / 29030400);
  if (interval >= 1) {
    subInterval = Math.floor(seconds / 2419200) - (interval * 12);
    subInterval = subInterval > 0 ? subInterval + " month" + (subInterval != 1 ? 's ' : ' ') : '';
    return interval + " year" + (interval != 1 ? 's ' : ' ') + subInterval + 'ago';
  }
  interval = Math.floor(seconds / 2419200);
  if (interval >= 1) {
    subInterval = Math.floor(seconds / 604800) - (interval * 4);
    subInterval = subInterval > 0 ? subInterval + " week" + (subInterval != 1 ? 's ' : ' ') : '';
    return interval + " month" + (interval != 1 ? 's ' : ' ') + subInterval + 'ago';
  }
  interval = Math.floor(seconds / 604800);
  if (interval >= 1) {
    subInterval = Math.floor(seconds / 86400) - (interval * 7);
    subInterval = subInterval > 0 ? subInterval + " day" + (subInterval != 1 ? 's ' : ' ') : '';
    return interval + " week" + (interval != 1 ? 's ' : ' ') + subInterval + 'ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    subInterval = Math.floor(seconds / 3600) - (interval * 24);
    subInterval = subInterval > 0 ? subInterval + " hour" + (subInterval != 1 ? 's ' : ' ') : '';
    return interval + " day" + (interval != 1 ? 's ' : ' ') + subInterval + 'ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    subInterval = Math.floor(seconds / 60) - (interval * 60);
    subInterval = subInterval > 0 ? subInterval + " minute" + (subInterval != 1 ? 's ' : ' ') : '';
    return interval + " hour" + (interval != 1 ? 's ' : ' ') + subInterval + 'ago';
  }
  interval = Math.round(seconds / 60);
  if (interval >= 1) {
    return interval + " minute" + (interval != 1 ? 's' : '') + ' ago';
  }
  return Math.round(seconds) + " second" + (interval != 1 ? 's' : '') + ' ago';
};

// Overwrites slaveObj's values with masterObj's and adds masterObj's if non existent in slaveObj
module.exports.mergeObjects = function(slaveObj ={}, masterObj = {}) {
  var obj3 = {};
  for (var attrname in slaveObj) { obj3[attrname] = slaveObj[attrname]; }
  for (var attrname in masterObj) { obj3[attrname] = masterObj[attrname]; }
  return obj3;
};

module.exports.versionCompare = function (v1, v2, options) {
  var zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

  function isValidPart(x) {
    return /^\d+$/.test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  v1parts = v1parts.map(Number);
  v2parts = v2parts.map(Number);

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length == i) {
      return -1;
    }

    if (v1parts[i] == v2parts[i]) {
      continue;
    }
    else if (v1parts[i] > v2parts[i]) {
      return -1;
    }
    else {
      return 1;
    }
  }

  if (v1parts.length != v2parts.length) {
    return 1;
  }

  // By Jon: http://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
  return 0;
};