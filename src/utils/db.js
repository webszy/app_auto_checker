const low = require('lowdb')
const env = process.env.NODE_ENV
const FileSync = require('lowdb/adapters/FileSync')
const dbPath = './db/DATA.json'
const adapter = new FileSync(dbPath)
const db = low(adapter)
module.exports = db
