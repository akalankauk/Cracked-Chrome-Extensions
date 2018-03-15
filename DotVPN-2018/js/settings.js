var _userData = typeof localStorage['userData'] == 'undefined'
  ? {} : JSON.parse(localStorage['userData']);

resetSettings = function() {
  var udid = _userData['udid'];
  var firstRun = _userData['firstRun'];

  _userData = {};
  _userData['udid'] = udid;
  _userData['firstRun'] = firstRun;

  localStorage['userData'] = JSON.stringify(_userData);
}

function getSetting(name, nullValue) {
  if (typeof _userData[name] == 'undefined') {
    _userData[name] = nullValue;
  }

  return _userData[name];
}

function setSetting(name, val) {
  _userData[name] = val;
  localStorage['userData'] = JSON.stringify(_userData);
}

settings = {
  set email(val) {
    setSetting('email', val);
  },
  get email() {
    return getSetting('email', null);
  },

  set token(val) {
    setSetting('token', val);
  },
  get token() {
    return getSetting('token', null);
  },

  set enabled(val) {
    setSetting('enabled', val);
  },
  get enabled() {
    return getSetting('enabled', false);
  },

  set location(val) {
    setSetting('location', val);
  },
  get location() {
    return getSetting('location', 'us');
  },

  set bwGroup(val) {
    setSetting('bwGroup', val);
  },
  get bwGroup() {
    return getSetting('bwGroup', '');
  },

  set autoStart(val) {
    setSetting('autoStart', val);
  },
  get autoStart() {
    return getSetting('autoStart', false);
  },

  set name(val) {
    setSetting('name', val);
  },
  get name() {
    return getSetting('name', '');
  },

  set premium(val) {
    setSetting('premium', val);
  },
  get premium() {
    return getSetting('premium', false);
  },

  set event(val) {
    setSetting('event', val);
  },
  get event() {
    return getSetting('event', null);
  },

  set node(val) {
    setSetting('node', val);
  },
  get node() {
    return getSetting('node', '');
  },

  set nodes(val) {
    setSetting('nodes', val);
  },
  get nodes() {
    return getSetting('nodes', {});
  },

  set nodesIps(val) {
    setSetting('nodesIps', val);
  },
  get nodesIps() {
    return getSetting('nodesIps', {});
  },

  set backupNodes(val) {
    setSetting('backupNodes', val);
  },
  get backupNodes() {
    return getSetting('backupNodes', {});
  },

  set backupNodesIps(val) {
    setSetting('backupNodesIps', val);
  },
  get backupNodesIps() {
    return getSetting('backupNodesIps', {});
  },

  set connectionInfo(val) {
    setSetting('connectionInfo', val);
  },
  get connectionInfo() {
    return getSetting('connectionInfo', {});
  },

  set udid(val) {
    setSetting('udid', val);
  },
  get udid() {
    return getSetting('udid', null);
  },

  set eventView(val) {
    setSetting('eventView', val);
  },
  get eventView() {
    return getSetting('eventView', false);  
  },

  set eventExpire(val) {
    setSetting('eventExpire', val);
  },
  get eventExpire() {
    return getSetting('eventExpire', false);  
  },

  set signinBoxState(val) {
    setSetting('signinBoxState', val);
  },
  get signinBoxState() {
    return getSetting('signinBoxState', null);
  },

  set signinBoxStateData(val) {
    setSetting('signinBoxStateData', val);
  },
  get signinBoxStateData() {
    return getSetting('signinBoxStateData', []);
  },

  set bandwidthSaver(val) {
    setSetting('bandwidthSaver', val);
  },
  get bandwidthSaver() {
    return getSetting('bandwidthSaver', true);
  },

  set adblock(val) {
    setSetting('adblock', val);
  },
  get adblock() {
    return getSetting('adblock', true);
  },

  set trackingProtection(val) {
    setSetting('trackingProtection', val);
  },
  get trackingProtection() {
    return getSetting('trackingProtection', true);
  },

  set blockAnalytics(val) {
    setSetting('blockAnalytics', val);
  },
  get blockAnalytics() {
    return getSetting('blockAnalytics', true);
  },

  set firewall(val) {
    setSetting('firewall', val);
  },
  get firewall() {
    return getSetting('firewall', true);
  },

  set adblockStat(val) {
    setSetting('adblockStat', val);
  },
  get adblockStat() {
    return getSetting('adblockStat', 0);
  },

  set trackersStat(val) {
    setSetting('trackersStat', val);
  },
  get trackersStat() {
    return getSetting('trackersStat', 0);
  },

  set analyticsStat(val) {
    setSetting('analyticsStat', val);
  },
  get analyticsStat() {
    return getSetting('analyticsStat', 0);
  },

  set firewallStat(val) {
    setSetting('firewallStat', val);
  },
  get firewallStat() {
    return getSetting('firewallStat', 0);
  },

  set hideAppIcon(val) {
    setSetting('hideAppIcon', val);
  },
  get hideAppIcon() {
    return getSetting('hideAppIcon', false);
  },

  set firstRun(val) {
    setSetting('firstRun', val);
  },
  get firstRun() {
    return getSetting('firstRun', true);
  },

  set lastSpOfferShow(val) {
    setSetting('lastSpOfferShow', val);
  },
  get lastSpOfferShow() {
    return getSetting('lastSpOfferShow', 0);
  },

  set accType(val) {
    setSetting('accType', val);
  },
  get accType() {
    return getSetting('accType', null);
  },

  set bwStat(val) {
    setSetting('bwStat', val);
  },
  get bwStat() {
    return getSetting('bwStat', null);
  }
};