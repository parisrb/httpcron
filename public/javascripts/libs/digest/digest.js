(function() {
  var HTTPDigest;
  var __hasProp = Object.prototype.hasOwnProperty;
  HTTPDigest = (function() {
    HTTPDigest.maxTryouts = 1;
    function HTTPDigest(username, password) {
      this.nc = 0;
      this.cnonce = "0a4f113b";
      this.username = username;
      this.password = password;
      this.unauthorizedCode = 401;
    }
    HTTPDigest.prototype.authenticate = function(headers) {
      var d, header, key, value, _i, _len, _ref, _ref2;
      d = {};
      _ref = headers.replace(/^Digest\s?/, "").split(/\s?,\s?/);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        header = _ref[_i];
        if (header.match(/^nonce=/)) {
          d.nonce = header.replace(/^nonce=\s?/, "").replace(/"/g, "");
        } else {
          _ref2 = header.split(/\s?=\s?/), key = _ref2[0], value = _ref2[1];
          d[key] = value.replace(/"/g, "");
        }
      }
      //this.ha1 = md5("" + this.username + ":" + d.realm + ":" + this.password);
      return this.digest = d;
    };
    HTTPDigest.prototype.ha1 = function() {
      if (this.password) {
        this._ha1 = md5("" + this.username + ":" + this.digest.realm + ":" + this.password);
        delete this.password;
      }
      return this._ha1;
    };
    HTTPDigest.prototype.headers = function(url, method) {
      var auth, authArray, headers, key, value;
      headers = {
        "X-Digest-Unauthorized": this.unauthorizedCode
      };
      if (this.digest) {
        auth = {
          uri: url,
          response: this.response(url, method),
          username: this.username,
          cnonce: this.cnonce,
          realm: this.digest.realm,
          nonce: this.digest.nonce,
          opaque: this.digest.opaque
        };
        authArray = [];
        for (key in auth) {
          if (!__hasProp.call(auth, key)) continue;
          value = auth[key];
          authArray.push("" + key + "=\"" + value + "\"");
        }
        authArray.push("qop=" + this.digest.qop);
        authArray.push("nc=" + this.nc);
        headers["Authorization"] = "Digest " + (authArray.join(', '));
      }
      return headers;
    };
    HTTPDigest.prototype.reset = function() {
      this.digest = null;
      this.nc = 0;
      this.cnonce = "0a4f113b";
      return this.count = 0;
    };
    HTTPDigest.prototype.response = function(url, method) {
      var ha2;
      if (method == null) {
        method = "GET";
      }
      if (this.digest && this.ha1()) {
        this.nc += 1;
        ha2 = md5("" + (method.toUpperCase()) + ":" + url);
        return md5("" + this.ha1() + ":" + this.digest.nonce + ":" + this.nc + ":" + this.cnonce + ":" + this.digest.qop + ":" + ha2);
      } else {
        throw "Invalid Digest Authentication";
      }
    };
    return HTTPDigest;
  })();
  this.HTTPDigest = HTTPDigest;
}).call(this);
