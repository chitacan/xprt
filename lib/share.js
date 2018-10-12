const auth = require('./auth')
const {resolve, basename} = require('path')
const {readFileSync} = require('fs')
const {Signale, fatal} = require('signale')

const log = new Signale({interactive: true})

module.exports = async (filePath, {public = false, raw = false}) => {
  try {
    const github = await auth()
    const files = filePath.map(path => {
      const name = basename(path)
      const content = readFileSync(resolve(process.cwd(), path), 'utf8')
      return {name, content}
    }).reduce((acc, {name, content}) => {
      return {
        ...acc,
        [name]: {
          content
        }
      }
    }, {})
    log.pending('upload to gist...')
    const result = await github.gists.create({
      description: 'xprt data',
      public,
      files
    })
    .then(d => d.data)

    if (raw) {
      Object.keys(result.files)
        .map(filename => {
          return {name: filename, raw_url: result.files[filename].raw_url}
        })
        .forEach(({name, raw_url}) => {
          console.log(`${name}: ${raw_url}`)
        })
    } else {
      log.success(result.html_url)
    }
  } catch (err) {
    fatal(err)
  }
}
