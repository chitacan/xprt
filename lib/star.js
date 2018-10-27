const {outputJsonSync} = require('fs-extra')
const {Signale, fatal} = require('signale')
const auth = require('./auth')
const {paginateStarred, destructureStarred} = require('./utils')

const starLog = new Signale({interactive: true, scope: 'star'})
const resultLog = new Signale({scope: 'result'})

module.exports = async () => {
  try {
    const github = await auth()
    const user = await github.users.get().then(d => d.data.login)
    const starred = await paginateStarred(github, user, starLog)
      .then(d => d.map(destructureStarred))
    resultLog.fav('starred: %d', starred.length)
    outputJsonSync('starred.json', {created: new Date(), starred}, {spaces: 2})
    resultLog.success('result saved on "starred.json"')
  } catch (err) {
    fatal(err)
  }
}
