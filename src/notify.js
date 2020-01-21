const rp = require('request-promise')
const to = require('await-to-js').default
const { db, parseTime } = require('./utils')
const env = process.env.NODE_ENV
const config = require('./config.json')
console.log('TCL: env', env)
console.log('TCL: config[env].feishuBot', config[env].feishuBot)
const getAppURL = async ({ bundleId, platform, appleId }) => {
  if (platform === 'iOS') {
    return `https://www.qimai.cn/app/rank/appid/${appleId}/country/us`
  } else {
    // const options = {
    //   method: 'get',
    //   url: 'https://api.qimai.cn/search/checkHasBundleId',
    //   qs: {
    //     analysis: 'YVYNQi1eckZTA2IAYTNUTT0HfA1paGJcaV5cUAVmBVl0FU5DVVFCU1gfWwxSWw98VxJyRV5UXFV5XCQUDlAEBFUDBgIBCQNwG1U%3D',
    //     search: bundleId
    //   },
    //   resolveWithFullResponse: true
    // }
    // let [err, res] = await to(rp(options))
    // let body = null
    // if (err) {
    //   [err, res] = await to(rp(options))
    // } else if (res && res.body) {
    //   body = JSON.parse(res.body)
    // }
    // if (body.app_id) {
    //   return `https://www.qimai.cn/andapp/baseinfo/appid/${body.app_id}`
    // } else {
    //   return '链接获取失败'
    // }
    return `https://play.google.com/store/apps/details?id=${bundleId}`
  }
}
const sendMsg = async ({ appName, bundleId, platform, appleId }) => {
  let msg = ''
  const title = `${platform} 下架通知`
  const url = await getAppURL({ bundleId, platform, appleId })
  if (platform === 'iOS') {
    msg = `项目名：${appName}\n包名: ${bundleId}\nappleId: ${appleId}\n平台：${platform}\n七麦: ${url}\n该产品已经下架，请注意!`
  } else {
    msg = `项目名：${appName}\n包名: ${bundleId}\n平台：${platform}\n链接: ${url}\n该产品已经下架，请注意!`
  }
  const options = {
    method: 'post',
    url: config[env].feishuBot,
    body: {
      title: title,
      text: msg
    },
    json: true
  }
  const [err, res] = await to(rp(options))
  console.log('sendNotify:', msg)
  if (err) {
    return sendMsg(appName, bundleId, platform)
  }
  if (res && res.ok) {
    const notifiedOn = parseTime(new Date())
    await db.get('appList').find({ bundleId, platform }).assign({ notified: true, notifiedOn }).write()
  }
  return true
}
const sendNotify = async () => {
  const list = await db.get('appList').filter({ status: 0, notified: false }).value()
  console.log('begin send notify,send count: ', list.length)
  if (list.length === 0) {
    return
  }
  for (const k of list) {
    await sendMsg(k)
  }
  return true
}

module.exports = sendNotify
