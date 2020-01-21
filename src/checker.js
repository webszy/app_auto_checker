const { parseTime, db, waitSeocond } = require('./utils')
const rp = require('request-promise')
const to = require('await-to-js').default
const env = process.env.NODE_ENV
const config = require('./config.json')
const checkAndroidApp = async id => {
  const options = {
    method: 'get',
    url: 'https://play.google.com/store/apps/details',
    qs: { id },
    resolveWithFullResponse: true
  }
  // console.log('TCL: checkAndroidApp -> options', options.url)
  if (env === 'development') {
    options.proxy = config.proxy
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
  console.log('TCL: checkiOSApp -> options', options.url)
  if (env === 'development') {
    options.proxy = config.proxy
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
  if (platform === 'Android') {
    status = await checkAndroidApp(bundleId)
    if (status === 0) {
      // 当状态为0时，隔0.5s再请求一次，避免网络错误
      await waitSeocond(20)
      status = await checkAndroidApp(bundleId)
    }
  } else {
    status = await checkiOSApp(appleId)
    if (status === 0) {
      // 当状态为0时，隔0.5s再请求一次，避免网络错误
      await waitSeocond(20)
      status = await checkAndroidApp(appleId)
    }
  }
  await afterAppCheck(bundleId, platform, status)
  return status
}
const listChecker = async () => {
  const list = await db.get('appList').filter({ status: 1 }).value()
  console.log('begin check app list,number of online app: ' + list.length)
  const lastUpdate = parseTime(new Date())
  db.set('lastUpdate', lastUpdate).write()
  if (list.length === 0) {
    return false
  }
  let i = 0
  for (const k of list) {
    console.log(`${++i} checking ${k.appName}`)
    await waitSeocond(15)
    await sigleChecker(k)
  }
  return true
}
const afterAppCheck = async (bundleId, platform, status) => {
  let updated = {}
  const lastCheckedOn = parseTime(new Date())
  updated.lastCheckedOn = lastCheckedOn
  updated.status = status
  await db.get('appList').find({ platform, bundleId }).assign(updated).write()
  return true
}
module.exports = {
  sigleChecker,
  listChecker
}
