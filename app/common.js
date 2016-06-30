module.exports.timeSince = (date) => {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval;

  interval = Math.round(seconds / 31536000);
  if (interval >= 1) {
    return interval + " year" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.round(seconds / 2592000);
  if (interval >= 1) {
    return interval + " month" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.round(seconds / 86400);
  if (interval >= 1) {
    return interval + " day" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.round(seconds / 3600);
  if (interval >= 1) {
    return interval + " hour" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.round(seconds / 60);
  if (interval >= 1) {
    return interval + " minute" + (interval != 1 ? 's' : '') + ' ago';
  }
  return Math.round(seconds) + " second" + (interval != 1 ? 's' : '') + ' ago';
};

// Overwrites slaveObj's values with masterObj's and adds masterObj's if non existent in slaveObj
module.exports.mergeObjects = function(slaveObj, masterObj){
  var obj3 = {};
  for (var attrname in slaveObj) { obj3[attrname] = slaveObj[attrname]; }
  for (var attrname in masterObj) { obj3[attrname] = masterObj[attrname]; }
  return obj3;
};