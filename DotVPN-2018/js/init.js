var proxy = new ProxyController();
var lastConnectTime = 0;
var lastReconnectTime = 0;
var connectDelay = 1000;
var apiHost = 'https://apache-iv.com';

var iconDisconnectedTimer;
var iconConnectingTimer;
var iconConectedTimer;
var iconNumber = 1;

var browser = new RegExp('OPR/')
	.test(navigator.userAgent)
	? 'opr' : 'crm';

chrome.runtime.setUninstallURL('https://github.com/akalankauk/Cracked-Chrome-Extensions');

chrome.management.getAll(function(a) {
	a.forEach (function(ext) {
		if (ext.id == chrome.runtime.id ||
			ext.enabled == false) {
			return;
		}

		ext.permissions.forEach(function(p) {
			if (p == 'proxy') {
				chrome.management.setEnabled(ext.id, false);
			}
		});
	});
});

init(function() {
	if (settings.autoStart || settings.enabled) {
		enableProxy();
	}
});

window.setInterval(function() {
	if (settings.token == null) {
		return;
	}

	updateUserInfo();
}, 5 * 60 * 1000);

window.setInterval(checkNotifications, 5 * 60 * 1000);

function checkNotifications() {
	if (settings.token != null) {
		$.ajax({
			url: apiHost + '/2/user/notification',
			contentType: 'application/json',
			type: 'POST',
			data: JSON.stringify({
				token: settings.token
			}),
			dataType: 'json',
			success: function(data) {
				if (!data.event) {
					return;
				}

				if (data.event != settings.event) {
					settings.event = data.event;
					settings.eventView = false;
				}

				settings.eventExpire = data.eventExpire;
			},
			complete: function(xhr) {
				sendFailMetric(xhr);
			}
		});
	}
}

function getUnixtime() {
	return Math.round((new Date()).getTime() / 1000);
}

function init(callback) {
	if (!settings.hideAppIcon) {
		startIconDisconnectedAnimation();

	    chrome.browserAction.setTitle(
	    	{ title: chrome.i18n.getMessage('disconnected') });
	} else {
	    chrome.browserAction.setTitle(
	    	{ title: ' ' });
	}

	if (settings.token == null) {
		return;
	}
	proxy.init(settings.email, settings.token);

	if (callback) {
		callback();
	}
}

function updateUserInfo(callback) {
	$.ajax({
		url: apiHost + '/2/user/info',
		contentType: 'application/json',
		type: 'POST',
		data: JSON.stringify({
			token: settings.token,
			udid: settings.udid,
			type: browser,
			version: chrome.app.getDetails().version,
		}),
		dataType: 'json',
		success: function(data) {
			settings.bwGroup = data.bwGroup;
			settings.name = data.name;
			settings.premium = !!data.premium;
			settings.accType = data.accType;
settings.bwStat = data.bwStat;

			if (data.token2) {
				settings.token = data.token2;
			}

			if (callback) {
				callback();
			}
		},
		complete: function(xhr) {
			sendFailMetric(xhr);
		}
	});

	if (settings.udid != null) {
		return;
	}

	$.ajax({
		url: apiHost + '/2/user/create-udid',
		contentType: 'application/json',
		type: 'POST',
		data: JSON.stringify({
			token: settings.token
		}),
		dataType: 'json',
		success: function(data) {
			if (data.code == 0) {
				settings.udid = data.udid;
			}
		},
		complete: function(xhr) {
			sendFailMetric(xhr);
		}
	});
}

function sendMetric(type, metadata) {
  $.ajax({
    url: 'https://api.apohola.com/2/user/metric',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      token: settings.token,
      type: type,
      metadata: metadata
    }),
    dataType: 'json'
  });
}

function sendFailMetric(xhr) {
	if (xhr.statusText != 'OK') {
		sendMetric(3, {
			status: xhr.statusText,
			statusCode: xhr.status
		});
	}
}

function getNode(callback, errCallback) {
	$.ajax({
      url: apiHost + '/2/user/get-node',
      contentType: 'application/json',
      type: 'POST',
      tryCount: 0,
      retryLimit : 3,
      data: JSON.stringify({
        token: settings.token,
        location: settings.location,
        udid: settings.udid
      }),
      dataType: 'json',
      success: function(data) {
		if (data.code == 0) {
      		settings.nodes[settings.location] = data.node;
      		settings.backupNodes[settings.location] = data.backupNode;

      		callback();
      	}
      },
      complete: function(xhr) {
      	//callback();
      	//sendFailMetric(xhr);
      },
      error: function() {
      	this.tryCount++;
      	if (this.tryCount <= this.retryLimit) {
      		$.ajax(this);
      		return;
      	}
      	
      	if (errCallback) {
      		errCallback();
      	}
      }
  	});
}

function enableProxy(callback) {//console.log(settings.nodes);
	if (settings.nodes[settings.location] &&
		settings.backupNodes[settings.location]) {
		proxy.setProxyEnabled(true);
		enableProxy_(callback);

		getNode(function() {
			proxy.setProxyEnabled(true);
		});
	} else {
		getNode(function() {
			proxy.setProxyEnabled(true);
			enableProxy_(callback);
		}, function() {
	      	proxy.setProxyEnabled(false);
      		disableProxy(callback);
		});
	}
}

function enableProxy_(callback) {
	settings.enabled = true;
	lastConnectTime = getUnixtime();

	if (!settings.hideAppIcon) {
		startIconConnectingAnimation();
	}

	setTimeout(function() {
		if (settings.enabled && !settings.hideAppIcon) {
			startIconConnectedAnimation();

			chrome.browserAction.setTitle(
				{ title: chrome.i18n.getMessage('connected') });

			  if (settings.firstRun) {
			    settings.firstRun = false;
			}

			/*setTimeout(function() {
			  if (settings.firstRun) {
			    settings.firstRun = false;

			    chrome.tabs.create(
			      {'url': 'https://dotvpn.com/mobile/'});
			  }
			}, 40 * 1000);*/
		}
	}, connectDelay);

	chrome.webRequest.onErrorOccurred.addListener(
		requestErrorHandler, {urls: ['<all_urls>']});

	setTimeout(function() {
	if (settings.lastSpOfferShow < getUnixtime() - 3600 * 12 &&
			settings.accType == 'free' && settings.email) {
		settings.lastSpOfferShow = getUnixtime();

		chrome.tabs.create(
		  		{'url': 'https://dotvpn.com/?token=' +
		  encodeURIComponent(settings.token)});
	}
	}, 5 * 1000);

	if (callback) {
		callback();
	}
}

function disableProxy(callback) {
	proxy.setProxyEnabled(false);
	settings.enabled = false;

	if (!settings.hideAppIcon) {
		startIconDisconnectedAnimation();

    chrome.browserAction.setTitle(
    	{ title: chrome.i18n.getMessage('disconnected') });
	}

	chrome.webRequest.onErrorOccurred.removeListener(
		requestErrorHandler);

    if (callback) {
		callback();
    }
}

function startIconDisconnectedAnimation() {
	stopIconAnimation();

	iconDisconnectedTimer = setInterval(function() {
		setIcon('off', iconNumber);

		if (iconNumber == 38) {
			stopIconAnimation();
		}

		iconNumber++;
	}, 50);
}

function startIconConnectingAnimation() {
	stopIconAnimation();

	iconConnectingTimer = setInterval(function() {
		setIcon('progress', iconNumber);

		if (iconNumber == 16) {
			stopIconAnimation();
		}

		iconNumber++;
	}, 50);
}

function startIconConnectedAnimation() {
	stopIconAnimation();

	iconConectedTimer = setInterval(function() {
		if (iconNumber > 27) {
			iconNumber = 1;
		}

		setIcon('on', iconNumber);

		iconNumber++;
	}, 50);
}

function stopIconAnimation() {
	clearInterval(iconDisconnectedTimer);
	clearInterval(iconConnectingTimer);
	clearInterval(iconConectedTimer);

	iconNumber = 1;
}

function setTransparentIcon() {
	stopIconAnimation();

	setIcon('', 'trans');
}

function setIcon(state, name) {
	chrome.browserAction.setIcon(
		{ path: {	'19': '/i/icons/38/' + state + '/' + name + '.png',
					'38': '/i/icons/38/' + state + '/' + name + '.png' } });
}

function requestErrorHandler(data) {
	//console.log(data);

	switch (data.error) {
		case 'net::ERR_PROXY_CERTIFICATE_INVALID':
		//case 'net::ERR_PROXY_CONNECTION_FAILED':
		//case 'net::ERR_TUNNEL_CONNECTION_FAILED':
			if (lastReconnectTime == 0) {
				lastReconnectTime = getUnixtime();
				disableProxy();
				enableProxy();
				//console.log('reconnect');
			}
			break;
	}
}
