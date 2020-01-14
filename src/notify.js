const rp = require('request-promise')
const to = require('await-to-js').default
const { db, parseTime } = require('./utils')
const sendMsg = async ({ appName, bundleId, platform, appleId }) => {
  let msg = ''
  const title = `${platform} 下架通知`
  if (platform === 'iOS') {
    msg = `项目名：${appName}\n包名: ${bundleId}\nappleId: ${appleId}\n平台：${platform}\n该产品已经下架，请注意!`
  } else {
    msg = `项目名：${appName}\n包名: ${bundleId}\n平台：${platform}\n该产品已经下架，请注意!`
  }
  const options = {
    method: 'post',
    url: 'https://open.feishu.cn/open-apis/bot/hook/284e09ac16f845e0ac13abeeaeb62fb2',
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
  console.log('need notify ', list.length)
  if (list.length === 0) {
    return
  }
  for (const k of list) {
    await sendMsg(k)
  }
  return true
}

module.exports = sendNotify
