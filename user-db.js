const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const utils = require(path.join(__dirname, 'utils.js'))

const isDev = process.env.NODE_ENV !== 'production'

class UserDB {
  constructor () {
    this.channel = 'user'

    this.dbDir = path.join(__dirname, 'db')
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir)
    }
    this.filepath = path.join(this.dbDir, this.channel) + '.db'
    this.open()
  }

  open () {
    this.init()
    this.db = new Database(this.filepath, { verbose: isDev ? console.log : null })
  }

  close () {
    this.db.close()
  }

  init () {
    try {
      if (!fs.existsSync(this.filepath)) {
        const samplePath = path.join(__dirname, 'dimension', this.channel) + '.db'
        fs.copyFileSync(samplePath, this.filepath)
      }
    } catch (e) {
      console.warn('拷貝預設的使用者資料庫失敗，嘗試動態生成 ... ')
      this.createUserTable()
    }
  }

  async createUserTable () {
    if (!fs.existsSync(this.filepath)) {
      const db = new Database(this.filepath, { verbose: isDev ? console.log : null })
      db.prepare(`
        CREATE TABLE IF NOT EXISTS "user" (
          "id"	TEXT NOT NULL,
          "name"	TEXT,
          "pw"	TEXT NOT NULL DEFAULT '2a4c124add170ac85243ab9649aa97f7',
          "authority"	INTEGER NOT NULL DEFAULT 0,
          "note"	TEXT,
          PRIMARY KEY("id")
        )
      `).run()
      await utils.sleep(400)
      db.close()
    }
  }

  replaceUser (params, retry = 0) {
    try {
      const prepared = this.db.prepare(`
        REPLACE INTO user(id, name, pw, authority, note)
        VALUES ($id, $name, $pw, $authority, $note)
      `)
      const replace = this.db.transaction((obj) => {
        return prepared.run(obj)
      })
      const info = replace.deferred({
        ...{
          id: 'HA00000000',
          name: '',
          pw: '2a4c124add170ac85243ab9649aa97f7',
          authority: 0,
          note: ''
        },
        ...params
      })
      // info: { changes: 1, lastInsertRowid: xx }
      isDev && console.log(`新增 ${this.channel} 使用者成功`, info)
      return info
    } catch (e) {
      if (retry < 3) {
        const delay = parseInt(Math.random() * 1000)
        isDev && console.warn(`新增使用者失敗，${delay} ms 後重試 (${retry + 1})`)
        setTimeout(this.replaceUser.bind(this, params, retry + 1), delay)
      } else {
        console.error(`新增 ${this.channel} 使用者失敗`, e)
      }
    }
  }

  getUser (id) {
    return this.db.prepare('SELECT * FROM user WHERE id = ?').get(id)
  }
  
  removeUser (id) {
    try {
      const prepared = this.db.prepare('DELETE FROM user WHERE id = $id')
      const deletion = this.db.transaction((id) => {
        return prepared.run({ id })
      })
      const result = deletion.deferred(id)
      // info: { changes: 1, lastInsertRowid: 0 }
      isDev && console.log(`移除 ${this.channel} 使用者 ${id} 成功`, result)
      return result
    } catch (e) {
      console.error(`移除 ${this.channel} 使用者 ${id} 失敗`, e)
    }
    return false
  }

  setAdmin (id, currentAuth) {
    try {
      // authority definition is 0 => normal, 1 => admin
      if ((currentAuth & 1) === 1) {
        isDev && console.log(`✔️ ${this.channel} #${id} 使用者已為管理者，略過不處理。`)
        return true
      }
      const updateAuth = currentAuth + 1
      const prepared = this.db.prepare('UPDATE user SET authority = $authority WHERE id = $id')
      const update = this.db.transaction((obj) => {
        return prepared.run(obj)
      })
      const result = update.deferred({ id, flag: updateAuth })
      // info: { changes: 1, lastInsertRowid: 0 }
      isDev && console.log(`🌟 將 ${this.channel} #${id} 使用者 設為管理者成功`, result)
      return result
    } catch (e) {
      console.error(`❌ 將 ${this.channel} #${id} 使用者 設為管理者失敗`, e)
    }
    return false
  }

  isAdmin (id) {
    try {
      const user = this.db.prepare('SELECT * FROM user WHERE id = ?').get(id)
      return (parseInt(user?.authority) & 1) === 1
    } catch (e) {
      console.error(`❌ 讀取 ${this.channel} #${id} 使用者 已讀屬性(authority)失敗`, e)
    }
    return false
  }
}
module.exports = UserDB
