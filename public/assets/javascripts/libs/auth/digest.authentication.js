
(function() {

var _digestCredentials = {};
var _digestAuthorizations = {};
var _orgXHR = XMLHttpRequest;

DigestAuthentication = {

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
  },

  getCredentials: function(host) {
    host = host || '*';
    if (_digestCredentials[host]) {
      return _digestCredentials[host];
    } else {
      return false;
    }
  },

  reset: function(host) {
    host = host || '*';
    delete _digestCredentials[host];
    _digestChalanges = {};
  }
};

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
  var _options = {}, _headers = {};
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
    var credentials = DigestAuthentication.getCredentials(_host);
    var Authorization = new DigestAuthentication.Header();
    Authorization.setCredantials(credentials.username, credentials.password);
    delete credentials.password;
    if (credentials.ha1) {
      Authorization.setHA1(credentials.ha1);
    }
    Authorization.parse(WWWAuthenticate);
    _digestAuthorizations[_host] = Authorization;
    DigestAuthentication.registerHA1(Authorization.getHA1(), _host);
    return Authorization.generate(_path, _options.method);
  };

  var _sendRequestWithAuthorizationHeader = function(header) {
    _xhr = new _orgXHR();
    _xhr.onreadystatechange = function() {
      if (_xhr.readyState === 4) {
        _readyState = _xhr.readyState;
        self.onreadystatechange.call(self);
      }
    };
    _xhr.open(_options.method, _options.url, _options.async);
    _xhr.setRequestHeader('Authorization', _buildChalange(header));
    for (name in _headers) {
      _xhr.setRequestHeader(name, _headers[name]);
    }
    _xhr.send(_data);
  };

  this.onreadystatechange = function() {};

  _xhr.onreadystatechange = function() {
    if (_xhr.readyState === 4 && _xhr.status === 401) {
      var WWWAuthenticate = _xhr.getResponseHeader('X-WWW-Authenticate');
      if (WWWAuthenticate) {
        _sendRequestWithAuthorizationHeader(WWWAuthenticate);
        return; 
      }
    }
    _readyState = _xhr.readyState;
    self.onreadystatechange.call(self);
  };

  this.open = function(method, url, async) {
    _options.method = method;
    _options.url = url;
    _options.async = async;
    _host = url.replace(/http:\/\//, '').split('/').shift();
    _path = url.replace(/http:\/\/[^\/]*/, '');
    _xhr.open(method, url, async);
  };

  this.send = function(data) {
    _data = data;
    var Authorization = _digestAuthorizations[_host];
    if (Authorization) {
      _xhr.setRequestHeader('Authorization', Authorization.generate(_path, _options.method));
    } else {
      data = null;
    }
    _xhr.send(data);
  };

  this.getResponseHeader = function(name) {
    return _xhr.getRequestHeader(name);
  };

  this.getAllResponseHeaders = function() {
    return _xhr.getAllResponseHeaders();
  };

  this.setRequestHeader = function(name, value) {
    _headers[name] = value;
    _xhr.setRequestHeader(name, value);
  };

  this.abort = function() {
    _xhr.abort();
  };

  this.overrideMimeType = function(mime) {
    _xhr.overrideMimeType(mime);
  };

};

})();
