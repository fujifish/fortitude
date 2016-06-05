import deep_diff from 'deep-diff/releases/deep-diff-0.3.3.min'

let API_ENDPOINT = '/api';

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(type, listener) {
    if (this.listeners[type] === undefined) {
      this.listeners[type] = {
        regexp: new RegExp(`^${type.replace(/[.]/g, '[.]').replace(/[*]/g, '.*')}$`),
        callbacks: []
      };
    }
    this.listeners[type].callbacks.push(listener);
  }

  off(type, listener) {
    if (this.listeners[type] !== undefined) {
      let index = this.listeners[type].callbacks.indexOf(listener);
      if (index != -1) {
        return !!this.listeners[type].callbacks.splice(index, 1);
      }
    }
    return false;
  }

  emit(event, ...data) {
    Object.keys(this.listeners).forEach(type => {
      let listener = this.listeners[type];
      if (listener.regexp.test(event)) {
        listener.callbacks.forEach(function(l) {
          try {
            l(...data);
          } catch (e) {
            console.error(`exception on listener emit: ${e.message}\n${e.stack}`);
          }
        });
      }
    });
  }
}

export default class Store extends EventEmitter {
  constructor(state) {
    super();
    this.state = state;
    this.commitedState = JSON.parse(JSON.stringify(state));
    this.scheduled = {};
  }

  commit() {
    let _this = this;
    var diffs = {};
    deep_diff.observableDiff(this.commitedState, this.state, function(diff) {
      deep_diff.applyChange(_this.commitedState, _this.state, diff);
      diffs[(diff.path.join('.'))] = diff;
    });
    Object.keys(diffs).forEach(function(d) {
      _this.emit(d, diffs[d]);
    });
    this.commitedState = JSON.parse(JSON.stringify(this.state));
  }

  makeRequest(method, extraUrl, data) {
    return fetch(API_ENDPOINT + (extraUrl ? extraUrl : ''), {
      method: method,
      credentials: 'same-origin',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': window.csrfToken
      },
      body: data
    }).then(checkStatus).then(parseJSON);
  }

  // set interval for 'methodName' - tries to not set the same method twice but race cond' can occur.
  startRefreshFor(methodName) {
    var _this = this;
    if (!this.isRefreshing(methodName))  {
      this.scheduled[methodName] = setInterval(() => _this[methodName](), window.refreshRate);
    }
  }

  // stop performing 'methodName'
  stopRefreshFor(methodName) {
    if (!this.isRefreshing(methodName)) return;
    var intervalId = this.scheduled[methodName];
    delete this.scheduled[methodName];
    clearInterval(intervalId);
  }

  isRefreshing(methodName) {
    return this.scheduled[methodName] != undefined;
  }

}