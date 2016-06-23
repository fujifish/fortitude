module.exports.timeSince = (date) => {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval;

  interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval + " year" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + " month" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + " day" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + " hour" + (interval != 1 ? 's' : '') + ' ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + " minute" + (interval != 1 ? 's' : '') + ' ago';
  }
  return Math.floor(seconds) + " second" + (interval != 1 ? 's' : '') + ' ago';
};