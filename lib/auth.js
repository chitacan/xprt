const retry = require('async-retry')
const open = require('open')
const rs = require('random-string')
const Github = require('@octokit/rest')
const fetch = require('node-fetch')
const {Signale, info} = require('signale')
const {URLSearchParams} = require('url')
const {homedir} = require('os')
const {join} = require('path')
const {existsSync, outputJsonSync, readJsonSync} = require('fs-extra')

const github = new Github({
  headers: {
    accept: 'application/vnd.github.squirrel-girl-preview'
  }
})

const authLog = new Signale({interactive: true, scope: 'auth'})

const OAUTH_URL = 'https://github.com/login/oauth/authorize?'
const SERVICE_URL= 'https://release-auth.zeit.sh?'
const CONFIG_PATH = join(homedir(), '.config', 'xprt')

const requestToken = () => {
  const params = {
    client_id: '08bd4d4e3725ce1c0465',
    scope: 'repo,gist',
    state: rs({length: 20})
  }
  const query = new URLSearchParams(params)

  authLog.await('[%d/3] - opening github oauth page', 1)
  open(OAUTH_URL + query)

  return retry(async () => {
    authLog.await('[%d/3] - request ', 2)
    const res = await fetch(SERVICE_URL + query).then(d => d.json())

    if (res.status === 403) {
      authLog.error('403 unauthorized')
      throw new Error('unauthorized')
    }

    if (res.error) {
      authLog.error(ers.error.message)
      throw res.error
    }
    authLog.success('[%d/3] - 200 ok', 3)
    return res.token
  }, {retries: 500})
}

module.exports = async () => {
  let token
  if (existsSync(CONFIG_PATH)) {
    info('using previously saved token')
    token = readJsonSync(CONFIG_PATH).token
  } else {
    token = await requestToken()
    outputJsonSync(CONFIG_PATH, {token})
  }

  github.authenticate({type: 'token', token})

  return github
}
