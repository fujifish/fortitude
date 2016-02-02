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
