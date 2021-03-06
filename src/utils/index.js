const db = require('./db')
const env = process.env.NODE_ENV
const parseTime = function (time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (('' + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  if (env === 'production') {
    const timstamp = date.getTime()
    date.setTime(timstamp + 8 * 1000 * 60 * 60) // 转化为中国时间
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const timeStr = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return timeStr
}
const newAppInfo = function (id, bundleId, platform, appName) {
  const appInfo = {
    appName,
    bundleId: '',
    platform,
    notified: false,
    notifiedOn: '',
    lastCheckedOn: ''
  }
  appInfo.bundleId = bundleId
  if (platform === 'iOS') {
    appInfo.appleId = id
  }
  return appInfo
}
const waitSeocond = second => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve && resolve(true)
    }, second * 1000)
  })
}
module.exports = {
  parseTime,
  newAppInfo,
  waitSeocond,
  db
}
