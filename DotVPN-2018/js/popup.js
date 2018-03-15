$(function() {
var bkg = chrome.extension.getBackgroundPage();
//var signupLock = false;
var connectDelay = 1000;

$('[data-resource]').each(function() {
  var el = $(this);
  var resourceName = el.data('resource');
  var resourceText = chrome.i18n.getMessage(resourceName);
  el.text(resourceText);
});

window.setInterval(function() {
  $('#timer').text(formatTime(bkg.getUnixtime() - bkg.lastConnectTime));
}, 1000);

function updateUI() {
  bkg.settings.premium = true;
  $('.map .on').toggleClass('on off');
  //renderStat();

  $('#country-label').text(
    $('#selectcountry > div > div [data-code="' + bkg.settings.location + '"]').text());

  $('#account-type-label').text(chrome.i18n.getMessage(
      $('#account-type-label').data(bkg.settings.premium
        ? 'premium-resource' : 'free-resource')));

  if (bkg.settings.premium) {
    $('#menu-premium-button').show();
    $('#menu-upgrade-button').hide();
  } else {
    $('#menu-premium-button').hide();
    $('#menu-upgrade-button').show();
  }

  if (bkg.settings.enabled) {
    $('#app').removeClass('app-red app-yellow').addClass('app-green');
    $('#timer').text(formatTime(bkg.getUnixtime() - bkg.lastConnectTime));
    $('#timer').show();
    $('.map .' + bkg.settings.location).toggleClass('off on');

    $('#conn-state-label').removeClass('text-opacity');
    $('#conn-state-label').text(
      $('#conn-state-label').data('connected'));

    /*if (bkg.settings.event != null) {
      window.setTimeout(function() {
        $('#promo').removeClass('promo-off').addClass('promo-on');
      }, 500);
    }*/
  } else {
    $('#app').removeClass('app-green app-yellow').addClass('app-red');
    $('#timer').hide();
    $('#promo').removeClass('promo-on').addClass('promo-off');

    $('#conn-state-label').text(
      $('#conn-state-label').data('disconnected'));
  }
}

if (bkg.settings.token == null) {
  showSigninView();
} else {
  showMainView();

  /*bkg.updateUserInfo(function() {
    if (bkg.settings.premium && bkg.settings.event == 2) {
      bkg.settings.event = null;
      updateNotification(2, 'close', null);
    }

    updateUI();
  });*/
}

function resetSigninFields() {
  $('#signin-email').val('');
  $('#signin-password').val('');
  $('#signin-retry-password').val('');
  $('#password-set-password').val('');
  $('#signup-password').val('');
}

function showSigninView() {
  $('#main-view').hide();

  var box = bkg.settings.signinBoxState;
  if (!bkg.settings.signinBoxState) {
    box = '#signin-email-box';
  }

  if (box != '#signin-email-box') {
    $('#signin-logo').addClass('logopoint');
  }

  for (var i = 0; i < bkg.settings.signinBoxStateData.length; i++) {
    var item = bkg.settings.signinBoxStateData[i];

    switch (item.type) {
      case 'input':
          $(item.id).val(item.value);
        break;

      case 'text':
          $(item.id).text(item.value);
        break;

      case 'class':
          $(item.id).removeClass().addClass(item.value);
        break;
    }
  }

  $(box).css('left', 0);
  $(box).show();

  $('#signin-view').show();
  $('#signin-email').focus();
}

function showMainView() {
  //renderNotification();

  updateUI();

  $('#app-version').text(chrome.app.getDetails().version);
  $('#email-label').text(bkg.settings.email);
  $('#popup-rate-browser').text(
    $('#popup-rate-browser').data(bkg.browser));

  var switchSettings = [{
      name: 'bandwidthSaver',
      el: '#bandwidth-saver-switch'
    }, {
      name: 'adblock',
      el: '#adblock-switch'
    }, {
      name: 'trackingProtection',
      el: '#tracking-protection-switch'
    }, {
      name: 'blockAnalytics',
      el: '#block-analytics-switch'
    }, {
      name: 'firewall',
      el: '#firewall-switch'
    }, {
      name: 'autoStart',
      el: '#auto-start-switch'
    }, {
      name: 'hideAppIcon',
      el: '#hide-app-icon'
    }];

  for (var i = 0; i < switchSettings.length; i++) {
    var state = bkg.settings[switchSettings[i].name] ? 'on' : 'off';
    $(switchSettings[i].el + ' > .switch').addClass('switch-' + state);
  }

  $('#app').removeClass('appleft').addClass('appmain');
  $('#backl').hide();

  $('#adblock-stat').text(bkg.settings.adblockStat);
  $('#trackers-stat').text(bkg.settings.trackersStat);
  $('#analytics-stat').text(bkg.settings.analyticsStat);
  $('#firewall-stat').text(bkg.settings.firewallStat);

  renderStat();
  renderBwStat();
  $.ajax({
      url: bkg.apiHost + '/2/user/blocked-stat',
      contentType: 'application/json',
      type: 'POST',
      data: JSON.stringify({
        token: bkg.settings.token,
        udid: bkg.settings.udid
      }),
      dataType: 'json',
      success: function(data) {
        if (data.code != 0) {
          return;
        }

        bkg.settings.adblockStat = data.stat.adblock;
        bkg.settings.trackersStat = data.stat.trackingProtection;
        bkg.settings.analyticsStat = data.stat.blockAnalytics;
        bkg.settings.firewallStat = data.stat.firewall;

        renderStat();
      },
      complete: function(xhr) {
        bkg.sendFailMetric(xhr);
      }
    });

  $('#main-view').show();
  $('#signin-view').hide();

  bkg.updateUserInfo(function() {
    renderBwStat();
    renderNotification();
    setTimeout(updateUI, connectDelay * 2);
  });
}

function renderBwStat() {
  if (!bkg.settings.bwStat) {
    return;
  }

  var i = 0;
  for (var cn in bkg.settings.bwStat) {
    $('#country-' + cn).data('order', i++);

    $('#country-' + cn + ' [data-ping="' + cn + '"]').text(bkg.settings.bwStat[cn].rtt);
    $('#country-' + cn + ' [data-free-bw="' + cn + '"]').text(bkg.settings.bwStat[cn].freeBw);
    $('#country-' + cn + ' [data-premium-bw="' + cn + '"]').text(bkg.settings.bwStat[cn].premiumBw);
  }

  $('> div', $('#country-list')).sort(function (a, b) {
    return ($(b).data('order')) < ($(a).data('order')) ? 1 : -1;
  }).appendTo($('#country-list'));
}

function renderNotification() {
  if (!bkg.settings.enabled) {
    return;
  }

  if (bkg.settings.event &&
      bkg.settings.eventExpire < bkg.getUnixtime()) {
    bkg.settings.event = null;
  }

  switch (bkg.settings.event) {
    case 3:
    case 4:
    case 6:
    case 7:
      if (bkg.settings.premium) {
        updateNotification(bkg.settings.event, 'close', null);
        bkg.settings.event = null;
      }
      break;
  }

  switch (bkg.settings.event) {
    /*case 1:
      shareEventHandler();
      break;*/

    case 3:
      trialStartEventHandler();
      break;

    case 4:
      trialEndEventHandler();
      break;

    case 5:
      mobileAppsEventHandler();
      break;

    case 6:
      trialNotification();
      break;

    case 7:
      trialPremiumFeatures();
      break;

    default:
      bkg.settings.event = null;
      break;
  }

  bkg.settings.eventView = true;

  if (bkg.settings.event != null) {
    window.setTimeout(function() {
      $('#promo').removeClass('promo-off').addClass('promo-on');
    }, 500);
  }
}

function renderStat() {
  var items = {
    adblock: {
      el: '#adblock-stat',
      val: 'adblockStat'
    },
    trackingProtection: {
      el: '#trackers-stat',
      val: 'trackersStat'
    },
    blockAnalytics: {
      el: '#analytics-stat',
      val: 'analyticsStat'
    },
    firewall: {
      el: '#firewall-stat',
      val: 'firewallStat'
    }
  }
//console.log(bkg.settings.enabled);
  for (var key in items) {
    var item = items[key];

    if (bkg.settings[key] /*&& bkg.settings.enabled*/) {
      animateNumbers(
        $(item.el).text(),
        bkg.settings[item.val],
        item.el);
    } else {
      $(item.el).text('off');
    }
  }
}

function switchProxyState(callback) {
  if (bkg.settings.enabled) {
    bkg.disableProxy(callback);

    //renderStat();
  } else {
    $('#app').removeClass('app-green app-red').addClass('app-yellow');
    $('#timer').hide();

    $('#conn-state-label').addClass('text-opacity');
    $('#conn-state-label').text(
      $('#conn-state-label').data('connecting'));

    bkg.settings.adblockStat = 0;
    bkg.settings.trackersStat = 0;
    bkg.settings.analyticsStat = 0;
    bkg.settings.firewallStat = 0;

    $('#adblock-stat').text(bkg.settings.adblockStat);
    $('#trackers-stat').text(bkg.settings.trackersStat);
    $('#analytics-stat').text(bkg.settings.analyticsStat);
    $('#firewall-stat').text(bkg.settings.firewallStat);

    bkg.enableProxy(callback);
  }
}

$('#signin-email-button').click(function() {
  if (!validateEmail($('#signin-email').val().trim())) {
    shake('#signin-email');
    return;
  }

  $('#signin-email-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/check',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val().trim()
    }),
    dataType: 'json',
    success: function(data) {
      $('#loader').hide();

      switch (data.code) {
        case 0:
          $('#signup-email').text($('#signin-email').val());

          bkg.settings.signinBoxStateData.push({
            'id': '#signup-email',
            'type': 'text',
            'value': $('#signup-email').text()
          });

          showSignup();
          break;

        case 3:
          //$('#signin-user-name').text(data.name);
          //$('#password-reset-user-name').text(data.name);

          bkg.settings.signinBoxStateData.push({
            'id': '#signin-email',
            'type': 'input',
            'value': $('#signin-email').val()
          }/*, {
            'id': '#signin-user-name',
            'type': 'text',
            'value': $('#signin-user-name').text()
          }, {
            'id': '#password-reset-user-name',
            'type': 'text',
            'value': $('#password-reset-user-name').text()
          }*/);

          showSignin();
          break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

function showSignup() {
  $('#welcome-chart').removeClass().addClass('chart ch-signup');
  $('#signin-logo').addClass('logopoint');

  bkg.settings.signinBoxState = '#signup-step1-box';
  bkg.settings.signinBoxStateData.push({
    'id': '#welcome-chart',
    'type': 'class',
    'value': 'chart ch-signup'
  });

  slider('#signin-email-box', '#signup-step1-box', 'fwd', function() {
    $('#signup-password').focus();
  });
}

function showSignin() {
  $('#welcome-chart').removeClass().addClass('chart ch-signin');
  $('#signin-logo').addClass('logopoint');

  bkg.settings.signinBoxState = '#signin-password-box';
  bkg.settings.signinBoxStateData.push({
    'id': '#welcome-chart',
    'type': 'class',
    'value': 'chart ch-signin'
  });

  slider('#signin-email-box', '#signin-password-box', 'fwd', function() {
    $('#signin-password').focus();
  });
}

function signin(email, passwd, successCb, errorCb) {
  $.ajax({
    url: bkg.apiHost + '/2/user/signin',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: email,
      passwd: passwd
    }),
    dataType: 'json',
    success: function(data) {
      if (successCb) {
        successCb();
      }

      switch (data.code) {
        case 0:
          bkg.settings.email = $('#signin-email').val().trim();
          bkg.settings.token = data.token;

          bkg.settings.signinBoxState = null;
          bkg.settings.signinBoxStateData = [];

          resetSigninFields();
          showMainView();
          bkg.init(function() {
            switchProxyState(function() {
              setTimeout(updateUI, connectDelay);
            });
          });
          break;

        case 2:
          if (errorCb) {
            errorCb();
          }
          break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
}

$('#signin-button').click(function() {
  if (!$('#signin-password').val()) {
    shake('#signin-password');
    return;
  }

  $('#signin-password-box').hide();
  $('#loader').show();

  signin(
    $('#signin-email').val().trim(),
    $('#signin-password').val(),
    function() {
      $('#loader').hide();

      $('#signin-password-box').hide();
      $('#signin-password-retry-box').hide();
    },
    function() {
      $('#welcome-chart').removeClass().addClass('chart ch-password');

      bkg.settings.signinBoxState = '#signin-password-retry-box';
      bkg.settings.signinBoxStateData.push({
        'id': '#welcome-chart',
        'type': 'class',
        'value': 'chart ch-password'
      });

      slider('#signin-password-box', '#signin-password-retry-box', 'fwd', function() {
        $('#signin-retry-password').focus();
      });
  });
});

$('#signin-retry-button').click(function() {
  if (!$('#signin-retry-password').val()) {
    shake('#signin-retry-password');
    return;
  }

  signin(
    $('#signin-email').val().trim(),
    $('#signin-retry-password').val(),
    null,
    function() {
      shake('#signin-retry-password');
  });
});

$('#password-reset-link1').click(function() {
  $('#signin-password-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/reminder',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val()
    }),
    dataType: 'json',
    success: function() {
      $('#loader').hide();

      $('#password-reset-email').text($('#signin-email').val());
      $('#welcome-chart').removeClass().addClass('chart ch-activate');

      bkg.settings.signinBoxState = '#password-reset-box';
      bkg.settings.signinBoxStateData.push({
        'id': '#password-reset-email',
        'type': 'text',
        'value': $('#password-reset-email').text()
      }, {
        'id': '#welcome-chart',
        'type': 'class',
        'value': 'chart ch-activate'
      });

      slider('#signin-password-box', '#password-reset-box', 'fwd', function() {
        $('#password-reset-code').focus();
      });
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#password-reset-link').click(function() {
  $('#signin-password-retry-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/reminder',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val()
    }),
    dataType: 'json',
    success: function() {
      $('#loader').hide();

      $('#password-reset-email').text($('#signin-email').val());
      $('#welcome-chart').removeClass().addClass('chart ch-activate');

      bkg.settings.signinBoxState = '#password-reset-box';
      bkg.settings.signinBoxStateData.push({
        'id': '#password-reset-email',
        'type': 'text',
        'value': $('#password-reset-email').text()
      }, {
        'id': '#welcome-chart',
        'type': 'class',
        'value': 'chart ch-activate'
      });

      slider('#signin-password-retry-box', '#password-reset-box', 'fwd', function() {
        $('#password-reset-code').focus();
      });
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#password-activate-button').click(function() {
  if (!$('#password-reset-code').val()) {
    shake('#password-reset-code');
    return;
  }

  $.ajax({
    url: bkg.apiHost + '/2/user/reminder',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val(),
      code: $('#password-reset-code').val()
    }),
    dataType: 'json',
    success: function(data) {
      switch (data.code) {
        case 0:
          $('#welcome-chart').removeClass().addClass('chart ch-newpassword');

          bkg.settings.signinBoxState = '#password-set-box';
          bkg.settings.signinBoxStateData.push({
            'id': '#password-reset-code',
            'type': 'input',
            'value': $('#password-reset-code').val()
          }, {
            'id': '#welcome-chart',
            'type': 'class',
            'value': 'chart ch-newpassword'
          });

          slider('#password-reset-box', '#password-set-box', 'fwd', function() {
            $('#password-set-password').focus();
          });
          break;

        case 3:
          shake('#password-reset-code');
          break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#password-set-button').click(function() {
  if (!$('#password-set-password').val()) {
    shake('#password-set-password');
    return;
  }

  $('#password-set-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/reminder',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val(),
      code: $('#password-reset-code').val(),
      passwd: $('#password-set-password').val()
    }),
    dataType: 'json',
    success: function(data) {
      switch (data.code) {
        case 0:
          $('#loader').hide();

          signin(
            $('#signin-email').val().trim(),
            $('#password-set-password').val(),
            null,
            null);
          break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#signup-step1-button').click(function() {
  if (!$('#signup-password').val()) {
    shake('#signup-password');
    return;
  }

  /*$('#welcome-chart').removeClass().addClass('chart ch-name');

  bkg.settings.signinBoxState = '#signup-step2-box';
  bkg.settings.signinBoxStateData.push({
    'id': '#signup-password',
    'type': 'input',
    'value': $('#signup-password').val()
  }, {
    'id': '#welcome-chart',
    'type': 'class',
    'value': 'chart ch-name'
  });

  slider('#signup-step1-box', '#signup-step2-box', 'fwd', function() {
    $('#signup-name').focus();
  });*/

  $('#signup-step1-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/signup',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      email: $('#signin-email').val().trim(),
      passwd: $('#signup-password').val()
    }),
    dataType: 'json',
    success: function(data) {
      $('#loader').hide();

      switch (data.code) {
        case 0:
          bkg.settings.email = $('#signin-email').val().trim();
          bkg.settings.token = data.token;

          bkg.settings.signinBoxState = null;
          bkg.settings.signinBoxStateData = [];
          resetSigninFields();
          bkg.settings.event = 7;
          showMainView();
          bkg.init(function() {
            switchProxyState(function() {
              setTimeout(updateUI, connectDelay);
            });
          });
          break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#signup-change-email-link').click(function() {
  $('#welcome-chart').removeClass().addClass('chart ch-welcome');

  bkg.settings.signinBoxState = '#signin-email-box';
  bkg.settings.signinBoxStateData = [];

  slider('#signup-step1-box', '#signin-email-box', 'back', function() {
    $('#signin-email').focus();
  });
});

/*$('#signup-step2-button').click(function() {
  if (!$('#signup-name').val()) {
    shake('#signup-name');
    return;
  }
  if (!$('#signup-last-name').val()) {
    shake('#signup-last-name');
    return;
  }

  $('#signup-step2-box').hide();
  $('#loader').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/signup',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      name: $('#signup-name').val().trim(),
      lastName: $('#signup-last-name').val().trim(),
      email: $('#signin-email').val().trim(),
      passwd: $('#signup-password').val()
    }),
    dataType: 'json',
    success: function(data) {
      $('#loader').hide();

      switch (data.code) {
        case 0:
          bkg.settings.email = $('#signin-email').val().trim();
          bkg.settings.token = data.token;

          bkg.settings.signinBoxState = null;
          bkg.settings.signinBoxStateData = [];

          bkg.settings.event = 3;

          showMainView();
          bkg.init(function() {
            switchProxyState(function() {
              setTimeout(updateUI, connectDelay);
            });
          });
          break;

        case 4:
          /*$('#signup-email').removeClass().addClass('invalid');
          $('#signup-email').data('valid', 0);
          signupLock = false;*/
       /*    break;
      }
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});*/

$('#signin-logo').click(function() {
  if (bkg.settings.signinBoxState == '#signin-email-box' ||
    !bkg.settings.signinBoxState) {
    return;
  }
  $(this).removeClass('logopoint');

  $('#welcome-chart').removeClass().addClass('chart ch-welcome');

  slider(bkg.settings.signinBoxState, '#signin-email-box', 'back', function() {
    $('#signin-email').focus();

    bkg.settings.signinBoxState = '#signin-email-box';
    bkg.settings.signinBoxStateData = [];
  });
})

$(':text, :password').keypress(function(e) {
  var b;

  switch(e.target.id) {
    case 'signin-email':
      b = '#signin-email-button';
      break;

    case 'signin-password':
      b = '#signin-button';
      break;

    case 'signin-retry-password':
      b = '#signin-retry-button';
      break;

    case 'password-reset-code':
      b = '#password-activate-button';
      break;

    case 'password-set-password':
      b = '#password-set-button';
      break;

    case 'signup-password':
      b = '#signup-step1-button';
      break;

    case 'signup-name':
    case 'signup-last-name':
      b = '#signup-step2-button';
      break;

    default:
      return;
  }

  if (e.which == 13) {
    $(b).click();
  }
});


$('.logo').click(function() {
  if ($('#selectcountry').hasClass('sc-on')) {
    $('.countries').trigger('click');
  }
});

$('.countries').click(function() {
  $('#selectcountry').toggleClass('sc-off sc-on');
});

$('#selectcountry > div > div').click(function() {
  var code = $(this).data('code');
  $('.countries').click();

  if (code != bkg.settings.location) {
    bkg.settings.location = code;
    bkg.settings.enabled = false;

    updateUI();
    switchProxyState(function() {
      window.setTimeout(function() {
        renderNotification();
        updateUI()
      }, connectDelay);
    });
  }
});

$('.signout').click(function() {
  bkg.resetSettings();
  bkg.disableProxy();
  showSigninView();
});

$('.icon-menu').click(function() {
  $('#app').toggleClass('appmain appleft');
  $('#backl').toggle();
});

$('.icon-settings').click(function() {
  $('#app').toggleClass('appmain appright');
  $('#backr').toggle();
});

$('#backl').click(function() {
  $('#app').toggleClass('appmain appleft');
  $('#backl').hide();
});

$('#backr').click(function() {
  $('#app').toggleClass('appmain appright');
  $('#backr').hide();
});

function openPopup(id) {
  $(id).show();
  $(id).animate({
      left: '0'
  }, 200, $.bez([0.785, 0.135, 0.150, 0.860]), function() {
    $('#app').removeClass('appleft appright');
    $('#app').addClass('appmain');

    $('#backl').hide();
    $('#backr').hide();
  });
}

$('#privacy').click(function() {
  openPopup('#privacy-popup');
});

$('#improve').click(function() {
  openPopup('#improve-popup');
});

$('#menu-upgrade-button').click(function() {
  openPopup('#upgrade-popup');
});

$('#menu-premium-button').click(function() {
  openPopup('#premium-popup');
});

$('#menu-change-password-button').click(function() {
  openPopup('#change-password-popup');
});

$('#password-reset-change-email-link').click(function() {
  $('#signin-logo').click();
});

$('#menu-share-button').click(function() {
  //$('#popup-share-user-name').text(bkg.settings.name);
  openPopup('#share-popup');
});

$('#menu-rate-button').click(function() {
  openPopup('#rate-popup');
});

$('#menu-support-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://github.com/akalankauk/Cracked-Chrome-Extensions/'})
});

$('#popup-start-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://github.com/akalankauk/Cracked-Chrome-Extensions/'});
});

$('#left-menu-account-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/?index&token=' +
      encodeURIComponent(bkg.settings.token)});
});

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

$('#connect-button').click(function() {
  if (bkg.settings.enabled) {
    switchProxyState(updateUI);
  } else {
    switchProxyState(function() {
      window.setTimeout(function() {
        renderNotification();
        updateUI();
      }, connectDelay);
    });
  }
});

$('#share-fb-button').click(function() {
  bkg.settings.event = null;

  updateNotification(1, 'close', {
      choice: 'fb'
    },
    function(data) {
      chrome.tabs.create(
        {'url': 'https://dotvpn.com/share/fb'});
    }
  );
});

$('#share-tw-button').click(function() {
  bkg.settings.event = null;

  updateNotification(1, 'close', {
      choice: 'tw'
    },
    function(data) {
      chrome.tabs.create(
        {'url': 'https://dotvpn.com/share/tw'});
    }
  );
});

$('#turbo-7day-button').click(function() {
  bkg.settings.event = null;

  $('#turbo-start-box').hide();
  $('#turbo-activating-box').show();

  $.ajax({
    url: bkg.apiHost + '/2/user/get-turbo',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      token: bkg.settings.token
    }),
    dataType: 'json',
    success: function(data) {
      if (data.code != 0) {
        return;
      }

      window.setTimeout(function() {
        updateNotification(3, 'close', null,
          function(data) {
            $('#turbo-activating-box').hide();
            $('#turbo-success-box').show();

            // for turbo-success-box
            bkg.checkNotifications();

            bkg.settings.enabled = false;
            switchProxyState(function() {
              setTimeout(updateUI, connectDelay);
            });
          }
        );
      }, 2000);
    },
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#turbo-diff-button').click(function() {
  $('#turbo-success-box').hide();
  $('#promo').removeClass('promo-on').addClass('promo-off');
  openPopup('#upgrade-popup');
});

$('#turbo-trial-button').click(function() {
  /*bkg.settings.event = null;

  updateNotification(4, 'close', null,
    function(data) {
      chrome.tabs.create(
        {'url': 'https://dotvpn.com/?token=' +
          encodeURIComponent(bkg.settings.token)});
    }
  );*/

  chrome.tabs.create(
    {'url': 'https://dotvpn.com/?token=' +
      encodeURIComponent(bkg.settings.token)});
});

$('#turbo-trial-button1').click(function() {
  $('#turbo-trial-button').trigger('click');
});

$('#google-play-button').click(function() {
  /*bkg.settings.event = null;

  updateNotification(5, 'close', {
      choice: 'gp'
    },
    function(data) {
      chrome.tabs.create(
        {'url': 'https://play.google.com/store/apps/details?id=com.dotvpn.vpn'});
    }
  );*/

  chrome.tabs.create(
    {'url': 'https://dotvpn.com/clients/android'});
});

$('#google-play-button1').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/clients/android'});
});

$('#app-store-button').click(function() {
  /*bkg.settings.event = null;

  updateNotification(5, 'close', {
      choice: 'as'
    },
    function(data) {
      chrome.tabs.create(
        {'url': 'https://itunes.apple.com/app/id1028849306'});
    }
  );*/

  chrome.tabs.create(
    {'url': 'https://dotvpn.com/clients/ios'});
});

$('#app-store-button1').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/clients/ios'});
});

$('#bandwidth-saver-switch').click(function() {
  updateSwitchSetting('bandwidthSaver', this);
});

$('#adblock-switch').click(function() {
  updateSwitchSetting('adblock', this);
});

$('#tracking-protection-switch').click(function() {
  updateSwitchSetting('trackingProtection', this);
});

$('#block-analytics-switch').click(function() {
  updateSwitchSetting('blockAnalytics', this);
});

$('#firewall-switch').click(function() {
  updateSwitchSetting('firewall', this);
});

$('#auto-start-switch').click(function() {
  updateSwitchSetting('autoStart', this);
});

$('#hide-app-icon').click(function() {
  updateSwitchSetting('hideAppIcon', this);

  if (bkg.settings.hideAppIcon) {
    bkg.setTransparentIcon();

    chrome.browserAction.setTitle(
      { title: ' ' });
  } else {
    if (bkg.settings.enabled) {
      bkg.startIconConnectedAnimation();

      chrome.browserAction.setTitle(
        { title: chrome.i18n.getMessage('connected') });
    } else {
      bkg.startIconDisconnectedAnimation();

      chrome.browserAction.setTitle(
        { title: chrome.i18n.getMessage('disconnected') });
    }
  }
});

function updateSwitchSetting(name, el) {
  bkg.settings[name] = !bkg.settings[name];
  $('#' + el.id + ' > .switch').toggleClass('switch-off switch-on');

  switch (name) {
    case 'bandwidthSaver':
    case 'adblock':
    case 'trackingProtection':
    case 'blockAnalytics':
    case 'firewall':
      renderStat();

      var s = {};
      s[name] = bkg.settings[name];

      $.ajax({
        url: bkg.apiHost + '/2/user/settings',
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify({
          token: bkg.settings.token,
          settings: s
        }),
        dataType: 'json',
        complete: function(xhr) {
          bkg.sendFailMetric(xhr);
        }
      });
      break;
  }
}

$('#rate-button').click(function() {
  switch (bkg.browser) {
    case 'crm':
      var url = 'https://chrome.google.com/webstore/detail/' +
        'dotvpn-free-and-secure-vp/kpiecbcckbofpmkkkdibbllpinceiihk';
      break;

    case 'opr':
      var url = 'https://addons.opera.com/en/extensions/details/' +
        'dotvpn-free-and-secure-vpn-2/';
      break;
  }

  chrome.tabs.create({'url': url});
});

$('.icon-close').click(function() {
  var popup = $(this).closest('.supup');

  popup.find('input:text, input:password, textarea').val('');
  popup.find('.inside').show();
  popup.find('.step').hide();

  popup.animate({
      top: 550
  }, 200, $.bez([0.785, 0.135, 0.150, 0.860]), function() {
    popup.hide();

    popup.css({
      left: 350,
      top: 0
    })
  });
});

$('#popup-fb-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/share/fb'});
});

$('#popup-tw-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/share/tw'});
});

$('#popup-password-button').click(function() {
  if ($('#popup-password').val() !=
      $('#popup-confirm-password').val() ||
      !($('#popup-password').val()) ||
      !($('#popup-confirm-password').val())) {
    shake('#popup-confirm-password');
    return;
  }

  $('#change-password-popup-loader').show();
  $('#change-password-popup .inside').hide();

  $.ajax({
    url: bkg.apiHost + '/2/user/passwd',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      token: bkg.settings.token,
      passwd: $('#popup-password').val()
    }),
    dataType: 'json',
    success: function(data) {
      if (data.code == 0) {
        $('#change-password-popup-finish').show();
      }
    },
    complete: function(xhr) {
      $('#change-password-popup-loader').hide();
      bkg.sendFailMetric(xhr);
    }
  });
});

$('#change-password-close-button').click(function() {
  $('.icon-close').trigger('click');
});

$('#support-popup-send-button').click(function() {
  if (!$('#support-popup-subject').val()) {
    $('#support-popup-subject').focus();
    shake($('#support-popup-subject'));
    return;
  }

  if (!$('#support-popup-text').val()) {
    $('#support-popup-text').focus();
    shake($('#support-popup-text'));
    return;
  }

  $('#support-popup-loader').show();
  $('#support-popup .inside').hide();

  sendFeedback(
    $('#support-popup-subject').val(),
    $('#support-popup-text').val(),
    function(data) {
      if (data.code == 0) {
        $('#support-popup-finish').show();
      }
    },
    function() {
      $('#support-popup-loader').hide();
    }
  );
});

$('#support-close-button').click(function() {
  $('.icon-close').trigger('click');
});

$('#improve-popup-send-button').click(function() {
  if (!$('#improve-popup-subject').val()) {
    $('#improve-popup-subject').focus();
    shake($('#improve-popup-subject'));
    return;
  }

  if (!$('#improve-popup-text').val()) {
    $('#improve-popup-text').focus();
    shake($('#improve-popup-text'));
    return;
  }

  $('#improve-popup-loader').show();
  $('#improve-popup .inside').hide();

  sendFeedback(
    $('#improve-popup-subject').val(),
    $('#improve-popup-text').val(),
    function(data) {
      if (data.code == 0) {
        $('#improve-popup-finish').show();
      }
    },
    function() {
      $('#improve-popup-loader').hide();
    }
  );
});

$('#improve-close-button').click(function() {
  $('.icon-close').trigger('click');
});

function sendFeedback(subject, text, success, complete) {
  $.ajax({
    url: bkg.apiHost + '/2/user/app-feedback',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      token: bkg.settings.token,
      udid: bkg.settings.udid,
      subject: subject,
      text: text
    }),
    dataType: 'json',
    success: success,
    complete: complete
  });
}

/*$('#popup-trial-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://dotvpn.com/?token=' +
      encodeURIComponent(bkg.settings.token)});
});*/

$('#popup-plans-button').click(function() {
  chrome.tabs.create(
    {'url': 'https://github.com/akalankauk/Cracked-Chrome-Extensions/'});
});

function formatTime(s) {
  var date = new Date(s * 1000);
  var days = Math.floor((date - new Date(0)) / (1000 * 60 * 60 * 24));

  var hh = date.getUTCHours() + days * 24;
  var mm = date.getUTCMinutes();
  var ss = date.getSeconds();

  if (hh < 10) { hh = '0' + hh; }
  if (mm < 10) { mm = '0' + mm; }
  if (ss < 10) { ss = '0' + ss; }

  return hh + ':' + mm + ':' + ss;
}

function shake(div) {
    var interval = 50;
    var distance = 6;
    var times = 4;

    $(div).css('position', 'relative');

    for (var i = 0; i < (times + 1); i++) {
        $(div).animate({
          left: ((i % 2 == 0 ? distance : distance * -1))
        }, interval);
    }

    $(div).animate({
      left: 0
  }, interval);
}

function slider(from, to, dir, cb) {
  $(from).animate({
      left: dir == 'fwd' ? '-150%' : '150%'
  }, 500, function() {
      if (dir == 'fwd') {
        $(this).css('left', '150%');
      }
      $(this).hide();

      if (cb) cb();
  });

  if (dir == 'back') {
    $(to).css('left', '-150%');
  }

  $(to).show();
  $(to).animate({
      left: '0'
  }, 500);
}

function animateNumbers(from, to, el) {
  jQuery({someValue: from}).animate({someValue: to}, {
    duration: 2000,
    easing:'swing',
    step: function() {
      $(el).text(Math.ceil(this.someValue));
    }
  });
}

function shareEventHandler() {
  //$('#share-user-name').text(bkg.settings.name);
  $('#share-box').show();

  updateNotification(1, 'view');
}

function trialStartEventHandler() {
  $('#turbo-start-box').show();

  updateNotification(3, 'view');
}

function trialEndEventHandler() {
  $('#turbo-end-box').show();

  updateNotification(4, 'view');
}

function trialNotification() {
  $('#turbo-notification-box').show();

  updateNotification(6, 'view');
}

function trialPremiumFeatures() {
  $('#turbo-success-box').show();

  updateNotification(7, 'view');
}

function mobileAppsEventHandler() {
  $('#mobile-apps-box').show();

  updateNotification(5, 'view');
}

function updateNotification(event, action, info, callback) {
  $.ajax({
    url: bkg.apiHost + '/2/user/notification',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      token: bkg.settings.token,
      event: event,
      action: action,
      info: info
    }),
    dataType: 'json',
    success: callback,
    complete: function(xhr) {
      bkg.sendFailMetric(xhr);
    }
  });
}

});