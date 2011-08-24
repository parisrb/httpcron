
(function() {

var _digestCredentials = {};
var _digestAuthorizations = {};
var _orgXHR = XMLHttpRequest;
// TODO: Clean up and reactivate this
var _bugyWebKit = false;

DigestAuthentication = {

  persistent: true,
  sessionStorageKey: 'DigestAuthenticationSession',

  registerInterface: function() {
    XMLHttpRequest = DigestAuthentication.XMLHttpRequest;
  },

  registerCredentials: function(username, password, host) {
    host = host || '*';
    var credentials = _digestCredentials[host] || {};
    credentials.username = username;
    credentials.password = password;
    _digestCredentials[host] = credentials;
  },

  registerUsername: function(username, host) {
    host = host || '*';
    var credentials = _digestCredentials[host] || {};
    credentials.username = username;
    _digestCredentials[host] = credentials;
  },

  registerPassword: function(password, host) {
    host = host || '*';
    var credentials = _digestCredentials[host] || {};
    credentials.password = password;
    _digestCredentials[host] = credentials;
  },

  registerHA1: function(ha1, host) {
    host = host || '*';
    var credentials = _digestCredentials[host] || {};
    credentials.ha1 = ha1;
    _digestCredentials[host] = credentials;
    this.saveSessionInfo();
  },

  reset: function(host) {
    host = host || '*';
    delete _digestCredentials[host];
    this.saveSessionInfo();
    _digestChalanges = {};
  },

  saveSessionInfo: function() {
    if (this.persistent) {
      localStorage.setItem(this.sessionStorageKey, JSON.stringify(_digestCredentials));
    }
  },

  loadSessionInfo: function() {
    if (this.persistent) {
      var data = localStorage.getItem(this.sessionStorageKey);
      if (data) {
        try {
          _digestCredentials = JSON.parse(data) || {};
        } catch (e) {
          _digestCredentials = {};
        }
      }
    }
  }
};

var getCredentials = function(host) {
  host = host || '*';
  if (_digestCredentials[host]) {
    return _digestCredentials[host];
  } else {
    return false;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  DigestAuthentication.loadSessionInfo();
}, false);

DigestAuthentication.Header = function() {
  var _username, _password, _ha1, _chalange, _cnonce, _nc;

  this.setCredantials = function(username, password) {
    _username = username;
    _password = password;
  };
  this.setHA1 = function(ha1) {
    _ha1 = ha1;
  };

  this.getHA1 = function() {
    return _ha1 || _generateHA1();
  };
  this.getRealm = function() {
    return _chalange.realm;
  };
  this.getUsername = function() {
    return _username;
  };

  this.parse = function(headers) {
    var header, key, value, _i, _len, _ref, _ref2;
    _chalange = {};
    _ref = headers.replace(/^Digest\s?/, "").split(/\s?,\s?/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      header = _ref[_i];
      if (header.match(/^nonce=/)) {
        _chalange.nonce = header.replace(/^nonce=\s?/, "").replace(/"/g, "");
      } else {
        _ref2 = header.split(/\s?=\s?/), key = _ref2[0], value = _ref2[1];
        _chalange[key] = value.replace(/"/g, "");
      }
    }
  };

  this.generate = function(url, method) {
    var auth, authArray, key;
    if (!_chalange) {
      throw new Error("No Digest Chalange");
    }
    auth = {
      uri: url,
      response: _generateResponse(url, method),
      username: _username,
      cnonce: _cnonce,
      realm: _chalange.realm,
      nonce: _chalange.nonce,
      opaque: _chalange.opaque,
      algorithm: _chalange.algorithm,
    };
    authArray = [];
    for (key in auth) {
      authArray.push("" + key + "=\"" + auth[key] + "\"");
    }
    authArray.push("qop=" + _chalange.qop);
    authArray.push("nc=" + _nc);
    return "Digest " + (authArray.join(', '));
  };

  this.reset = function() {
    _chalange = null;
    _nc = '00000000';
    _cnonce = _generateCnonce();
  };

  // private
  var _generateCnonce = function() {
    var number = Math.floor(Math.random()*100) + Math.floor(Math.random()*100)
      + Math.floor(Math.random()*100) + Math.floor(Math.random()*100);
    return md5(""+number);
  };
  var _generateHA1 = function() {
    if (_password && _chalange) {
      _ha1 = md5("" + _username + ":" + _chalange.realm + ":" + _password);
      _password = null;
    }
    return _ha1;
  };

  var _generateResponse = function(url, method) {
    if (method == null) { method = "GET"; }
    var ha1 = _ha1 || _generateHA1();
    if (_chalange && ha1) {
      _incrementNC();
      var ha2 = md5("" + (method.toUpperCase()) + ":" + url);
      return md5("" + ha1 + ":" + _chalange.nonce + ":" + _nc + ":" + _cnonce
        + ":" + _chalange.qop + ":" + ha2);
    }
    return '';
  };
  var _incrementNC = function() {
    var l = _nc.length, n = parseInt(_nc),
        str = '' + n+1;
    while (str.length < l) {
      str = '0' + str;
    }
    _nc = str;
  };

  this.reset();
};

DigestAuthentication.XMLHttpRequest = function() {
  var _xhr = new _orgXHR();
  var self = this;
  var _headers = {}, _method, _url, _async;
  var _readyState = 0, _path, _host;

  var _attrReaders = ['status', 'statusText', 'responseText', 'responseXML', 'upload'];
  var _attrAccessors = ['timeout', 'asBlob', 'followRedirects', 'withCredentials'];


  for (var i = 0; i < _attrReaders.length; i++) {
    (function() {
      var attrName = _attrReaders[i];
      Object.defineProperty(self, attrName, {
        get : function(){ return _xhr[attrName]; },
        enumerable : true
      });
    })();
  };

  for (var i = 0; i < _attrAccessors.length; i++) {
    (function() {
      var attrName = _attrAccessors[i];
      Object.defineProperty(self, attrName, {
        get : function(){ return _xhr[attrName]; },
        set : function(value){ _xhr[attrName] = value; },
        enumerable : true
      });
    })();
  };

  Object.defineProperty(this, "readyState", {
    get : function(){ return _readyState; },
    enumerable : true
  });

  var _buildChalange = function(WWWAuthenticate) {
    var credentials = getCredentials(); // FIXME: support get by host
    if (!credentials) { return; }
    var Authorization = new DigestAuthentication.Header();
    Authorization.setCredantials(credentials.username, credentials.password);
    delete credentials.password;
    if (credentials.ha1) {
      Authorization.setHA1(credentials.ha1);
    }
    Authorization.parse(WWWAuthenticate);
    _digestAuthorizations[_host] = Authorization;
    DigestAuthentication.registerHA1(Authorization.getHA1()); // FIXME: support get by host
    return Authorization.generate(_path, _method);
  };

  var _getResponseHeader = function(name) {
    if (_bugyWebKit) {
      if (name === 'Date' || name === 'WWW-Authenticate') {
        try {
          return JSON.parse(_xhr.responseText)[name];
        } catch (e) {}
      }
      return null;
    } else if (name === 'WWW-Authenticate') {
      name = 'X-WWW-Authenticate';
    }
    return _xhr.getResponseHeader(name);
  };

  var _requestedWith = _bugyWebKit ? 'XMLHttpRequest (body)' : 'XMLHttpRequest';

  var _sendRequestWithAuthorizationHeader = function(header) {
    var Authorization = _buildChalange(header);
    if (!Authorization) {
      _readyState = _xhr.readyState;
      self.onreadystatechange.call(self);
      return;
    }

    _xhr = new _orgXHR();
    _xhr.onreadystatechange = function() {
      if (_xhr.readyState === 4) {
        _readyState = _xhr.readyState;
        self.onreadystatechange.call(self);
      }
    };
    _xhr.open(_method, _url, _async);
    _xhr.setRequestHeader('Authorization', Authorization);
    _xhr.setRequestHeader('X-Requested-With', _requestedWith);

    for (name in _headers) {
      _xhr.setRequestHeader(name, _headers[name]);
    }
    _xhr.send(_data);
  };

  this.onreadystatechange = function() {};

  _xhr.onreadystatechange = function() {
    if (_xhr.readyState === 4 && _xhr.status === 401) {
      var WWWAuthenticate = _getResponseHeader('WWW-Authenticate');
      if (WWWAuthenticate) {
        _sendRequestWithAuthorizationHeader(WWWAuthenticate);
        return; 
      }
    }
    _readyState = _xhr.readyState;
    self.onreadystatechange.call(self);
  };

  this.open = function(method, url, async) {
    _method = method;
    _url = url;
    _async = async;
    _host = url.replace(/http:\/\//, '').split('/').shift();
    _path = url.replace(/http:\/\/[^\/]*/, '').split('?').shift();
    _xhr.open(method, url, async);
  };

  this.send = function(data) {
    _data = data;
    var Authorization = _digestAuthorizations[_host];
    if (Authorization) {
      _xhr.setRequestHeader('Authorization', Authorization.generate(_path, _method));
    } else {
      data = null;
    }
    _xhr.setRequestHeader('X-Requested-With', _requestedWith);

    _xhr.send(data);
  };

  this.getResponseHeader = function(name) {
    return _xhr.getResponseHeader(name);
  };

  this.getAllResponseHeaders = function() {
    return _xhr.getAllResponseHeaders();
  };

  this.setRequestHeader = function(name, value) {
    if (name !== 'X-Requested-With') {
      _headers[name] = value;
      _xhr.setRequestHeader(name, value);
    }
  };

  this.abort = function() {
    _xhr.abort();
  };

  this.overrideMimeType = function(mime) {
    _xhr.overrideMimeType(mime);
  };

};

})();