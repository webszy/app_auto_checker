const { parseTime, db } = require('./utils')
const rp = require('request-promise')
const to = require('await-to-js').default
const env = process.env.NODE_ENV
const checkAndroidApp = async id => {
  const options = {
    method: 'get',
    url: 'https://play.google.com/store/apps/details',
    qs: { id },
    resolveWithFullResponse: true
  }
  if (env === 'development') {
    options.proxy = 'http://127.0.0.1:8118'
  }
  const [err, res] = await to(rp(options))
  if (res && res.statusCode === 200) {
    // console.log('产品在线')
    return 1
  }
  if (err && err.statusCode >= 400) {
    // console.log('产品下架')
    return 0
  }
  return 1
}
const checkiOSApp = async (id, bundleId) => {
  const options = {
    method: 'get',
    url: `https://apps.apple.com/us/app/id${id}`,
    resolveWithFullResponse: true
  }  
  if (env === 'development') {
    options.proxy = 'http://127.0.0.1:8118'
  }
  const [err, res] = await to(rp(options))
  if (res && res.statusCode === 200) {
    // console.log('产品在线')
    return 1
  }
  if (err && err.statusCode >= 400) {
    // console.log('产品下架')
    return 0
  }
  return 1
}
const sigleChecker = async ({ appleId, bundleId, platform }) => {
  let status = 0
  if (platform === 'android') {
    status = await checkAndroidApp(bundleId)
  } else {
    status = await checkiOSApp(appleId)
  }
  const lastCheckedOn = parseTime(new Date())
  await db.get('appList').find({ platform, bundleId }).assign({ lastCheckedOn }).write()
  return status
}
const listChecker = async () => {
  const list = await db.get('appList').filter({ status: 1 }).value()
  const lastUpdate = parseTime(new Date())
  db.set('lastUpdate', lastUpdate).write()
  if (list.length === 0) {
    return false
  }
  for (const k of list) {
    const status = await sigleChecker(k)
    const lastCheckedOn = parseTime(new Date())
    await db.get('appList').find({ platform: k.platform, bundleId: k.bundleId }).assign({ status, lastCheckedOn }).write()
  }
  return true
}

module.exports = {
  sigleChecker,
  listChecker
}
