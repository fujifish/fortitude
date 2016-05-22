module.exports.escapeHtml = function(value){
  if (!value) {
    return value;
  }
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

module.exports.unescapeHtml = function(value){
  if (!value) {
    return value;
  }
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
};

module.exports.mongoSanitize = function(value){
  if (!value) {
    return value;
  }
  return value.indexOf('$') !== -1 ? '' : value;
};

// Overwrites slaveObj's values with masterObj's and adds masterObj's if non existent in slaveObj
module.exports.mergeObjects = function(slaveObj, masterObj){
  var obj3 = {};
  for (var attrname in slaveObj) { obj3[attrname] = slaveObj[attrname]; }
  for (var attrname in masterObj) { obj3[attrname] = masterObj[attrname]; }
  return obj3;
};