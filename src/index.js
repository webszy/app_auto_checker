const express = require('express')
const schedule = require('node-schedule')
const helmet = require('helmet')
const app = express()
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(helmet()) // for secure your header
const port = process.env.PORT || 3000
// 自定义模块
const { parseTime, newAppInfo, db } = require('./utils')
const { sigleChecker, listChecker } = require('./checker')
const sendNotify = require('./notify')
const now = parseTime(new Date())
const env = process.env.NODE_ENV
const config = require('./config.json')
const jobFunction = async () => {
  console.log('new Task is running on: ', parseTime(new Date()))
  await listChecker()
  await sendNotify()
  console.log('Task finished on: ', parseTime(new Date()))
  console.log('------------------------')
}
// 自动执行
if (env === 'production') {
  const rule = new schedule.RecurrenceRule()
  rule.minute = config.task.minute
  schedule.scheduleJob(rule, jobFunction)
}

// 对外提供接口
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Content-Type', 'application/json; charset=utf-8 ')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  // res.header('X-Powered-By', ' 4.17.1')
  // options请求快速返回
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
  } else {
    next()
  }
})
app.get('/', (req, res) => {
  res.send('what\'s the matter with you ?')
})
// 查询数据
app.get('/list', (req, res) => {
  if (![undefined, 'undefined', '0', '1'].includes(req.query.status)) {
    res.send('wrong request params')
    return
  }
  let data = null
  if (!req.query.status) {
    // 查询全部
    data = db.getState()
  } else {
    // 查询其他状态
    const status = parseInt(req.query.status)
    const appList = db.get('appList').filter({ status }).value()
    const lastUpdate = db.get('lastUpdate').value()
    data = {
      lastUpdate,
      appList
    }
  }
  if (data) {
    res.json(data)
  } else {
    res.json({
      code: 1,
      msg: '查询数据出错'
    })
  }
})
// 新增任务
app.post('/task', async (req, res) => {
  if (Object.keys(req.body).length !== 4) {
    res.send('wrong request body')
    return
  }
  const { appleId, bundleId, platform, appName } = req.body
  if (platform === 'iOS') {
    if (appleId === '' || bundleId === '') {
      res.json({
        code: 1,
        msg: '缺少参数，请检查'
      })
      return
    }
  }
  if (!appName || appName.length === 0) {
    res.json({
      code: 1,
      msg: '请输入appName'
    })
    return
  }
  if (!bundleId || bundleId.length === 0) {
    res.json({
      code: 1,
      msg: '请输入bundleId'
    })
    return
  }
  if (!platform || platform.length === 0) {
    res.json({
      code: 1,
      msg: '请输入platform'
    })
    return
  }
  const exist = await db.get('appList').filter({ bundleId, platform }).size().value()
  if (exist > 0) {
    res.json({
      code: 1,
      msg: 'bundleId和platform 已存在'
    })
    return
  }
  const newApp = newAppInfo(appleId, bundleId, platform, appName)
  newApp.status = await sigleChecker(newApp)
  await db.get('appList').push(newApp).write()
  await sendNotify()
  res.json({
    code: 0,
    msg: 'ok'
  })
})
app.post('/deltask', (req, res) => {
  // console.log(req.body)
  if (Object.keys(req.body).length !== 2) {
    res.send('wrong request body')
    return
  }
  const { bundleId, platform } = req.body
  if (bundleId.length === 0 || platform.length === 0) {
    res.json({
      code: 1,
      msg: '参数不正确'
    })
    return
  }
  const exist = db.get('appList').find({ bundleId, platform }).size().value()
  if (exist > 0) {
    db.get('appList').remove({ bundleId, platform }).write()
    res.json({
      code: 0,
      msg: 'ok'
    })
  } else {
    res.json({
      code: 1,
      msg: '未找到被删除项'
    })
  }
})
app.get('/checkall', (req, res) => {
  jobFunction()
  res.send('job begin, see logs')
})

app.listen(port, () => {
  console.log(`App listening on port: ${port} , currentTime: ${now} !`)
  // if (env === 'development') {
  //   process.nextTick(() => {
  //     jobFunction()
  //   })
  // }
})
