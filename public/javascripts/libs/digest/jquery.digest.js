(function() {
  jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    var digest, url;
    if ((options.digest != null) || $.httpDigest) {
      options.headers || (options.headers = {});
      digest = options.digest || $.httpDigest;
      digest.maxTryouts || (digest.maxTryouts = HTTPDigest.maxTryouts);
      url = options.url;
      if (!(digest.digest != null)) {
        digest.count = 0;
        if (digest.preflightUrl != null) {
          options.type = "head";
          options.url = digest.preflightUrl;
        }
      }
      $.extend(options.headers, digest.headers(options.url, options.type));
      jqXHR.success(function() {
        return digest.count = 0;
      });
      return jqXHR.error(function(xhr) {
        var dHeader, replayType, replayUrl;
        dHeader = xhr.getResponseHeader("WWW-Authenticate");
        if (xhr.status === digest.unauthorizedCode && dHeader.match(/^Digest/) && digest.count < digest.maxTryouts) {
          digest.count += 1;
          if (digest.digest && digest.preflightUrl) {
            replayUrl = digest.preflightUrl;
            replayType = "head";
          } else {
            replayUrl = url;
            replayType = originalOptions.type;
          }
          digest.authenticate(dHeader);
          return $.ajax(replayUrl, $.extend({}, originalOptions, {
            type: replayType
          }));
        } else {
          return xhr.status = 401;
        }
      });
    }
  });
}).call(this);
