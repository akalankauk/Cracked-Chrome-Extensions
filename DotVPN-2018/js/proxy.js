/**
 * Controls the state of the current proxy being used by Chrome.
 *
 * @constructor
 */
ProxyController = function()
{
  // Global status that states if the custom proxy is set.
  //this.proxyStatus = false;

  // Listen on Proxy Errors.
  chrome.proxy.onProxyError.addListener(this.onProxyError.bind(this));
};

ProxyController.prototype.init = function(email, password)
{
    this.email = email;
    this.password = password;

    chrome.webRequest.onAuthRequired.addListener(this.handleAuthRequest.bind(this),
      {urls: ['<all_urls>']}, ['asyncBlocking']);
};

/**
 * To know the status when the custom proxy server is active or online.
 *
 * @returns {boolean} true is custom proxy is set and active.
 */
ProxyController.prototype.handleAuthRequest = function(details, callback)
{
   if (details.isProxy) {
      callback({authCredentials: {username: this.email,
                                  password: this.password}});
   } else {
      callback();
   }
};

/**
 * Notifies about proxy errors.
 *
 * @parm {Object} details Gives the state of the error.
 */
ProxyController.prototype.onProxyError = function(details)
{
  //chrome.browserAction.setIcon({ path: ProxyController.ERROR_ICON });
  //chrome.browserAction.setTitle({title: details.error});
};

/**
 * Sets the current proxy server.
 *
 * @param {boolean} status_ True to turn it on, otherwise use the auto_detect
 *                          option to bring it back to normal.
 */
ProxyController.prototype.setProxyEnabled = function (status_)
{
  if (status_) {
    var config = {
      mode: 'pac_script',
      pacScript: {
        data: "\
          var d = true; \
          var it = " + ((new Date().getTime()) / 1000 + 4) + "; \
          var t = (new Date().getTime()) / 1000 + 4; \
\
          function FindProxyForURL(url, host) { \
            /*if (d) { \
              if ((new Date().getTime()) / 1000 > t || \
                  (new Date().getTime()) / 1000 < it) { \
                d = false; \
              } else { \
                return 'DIRECT'; \
              } \
            }*/ \
\
            host = host.toLowerCase(); " +
            'IPNotation = /^\\d+\\.\\d+\\.\\d+\\.\\d+$/g;' + " \
\
            if (isPlainHostName(host)) { \
              return 'DIRECT'; \
            } \
\
            var reservedNets = [ \
              '0.*.*.*', /* 0.0.0.0/8 */ \
              '10.*.*.*', /* 10.0.0.0/8 */ \
              '127.*.*.*', /* 127.0.0.0/8 */ \
              '169.254.*.*', /* 169.254.0.0/16 */ \
              '172.1[6-9].*.*', /* 172.16.0.0/12 */ \
              '172.2[0-9].*.*', /* 172.16.0.0/12 */ \
              '172.3[0-1].*.*', /* 172.16.0.0/12 */ \
              '192.0.0.*', /* 192.0.0.0/24 */ \
              '192.0.2.*', /* 192.0.2.0/24 */ \
              '192.168.*.*', /* 192.168.0.0/16 */ \
              '198.1[8-9].*.*', /* 198.18.0.0/15 */ \
              '198.51.100.*', /* 198.51.100.0/24 */ \
              '203.0.113.*', /* 203.0.113.0/24 */ \
              '22[4-9].*.*.*', /* 224.0.0.0/4 */ \
              '23[0-9].*.*.*', /* 224.0.0.0/4 */ \
            ]; \
\
            if (IPNotation.test(host)) { \
              for (i = 0; i < reservedNets.length; i++) { \
                if (shExpMatch(host, reservedNets[i])) { \
                  return 'DIRECT'; \
                } \
              }; \
            } \
\
            var direct = [ \
              'local', 'intra', 'intranet', 'dev' \
            ]; \
            for (var i = 0; i < direct.length; i++) { \
              if (dnsDomainIs(host, direct[i])) { \
                return 'DIRECT'; \
              } \
            } \
\
            if (dnsDomainIs(host, 'apache-iv.com')) { \
              return 'DIRECT'; \
            } \
\
            if (dnsDomainIs(host, 'api.apohola.com')) { \
              return 'DIRECT'; \
            } \
\
            return 'HTTPS " + settings.nodes[settings.location] + ":443; HTTPS " +
                              settings.backupNodes[settings.location] + ":443'; }"
      }
    };
    //console.log(settings.node);
  } else {
    var config = {
      mode: 'direct'
    };

    //chrome.webRequest.onAuthRequired.removeListener(this.handleAuthRequest);
  }

  // Describes the current proxy setting being used.
  var proxySettings = {
    'value': config,
    'scope': /*settings.incognito ? 'incognito_persistent' :*/ 'regular'
  };
  
  // Change the icon to reflect the current status of the proxy server.
  //var icon = 
  
  // Clear settings for both windows.
  //chrome.proxy.settings.clear({scope : 'incognito_persistent'});
  //chrome.proxy.settings.clear({scope : 'regular'});
  
  // Setup new settings for the appropriate window.
  chrome.proxy.settings.set(proxySettings, function() {});
};