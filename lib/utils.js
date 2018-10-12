const {URLSearchParams} = require('url')

const parseLinks = headers => {
  const {link} = headers

  const links = {}
  // link format:
  // '<https://api.github.com/users/aseemk/followers?page=2>; rel="next", <https://api.github.com/users/aseemk/followers?page=2>; rel="last"'
  link.replace(/<([^>]*)>;\s*rel="([\w]*)"/g, (m, uri, type) => {
    const params = new URLSearchParams(uri)
    links[type] = params.get('page')
  })

  return links
}

exports.paginate = async (github, method, opt = {}, handler = (res) => res.data, log) => {
  let response = await method({per_page: 100, ...opt})
  let data = handler(response)
  let pi
  while (github.hasNextPage(response)) {
    pi = parseLinks(response.headers)
    log.pending('fetching page [%d/%d]', pi.next, pi.last)
    response = await github.getNextPage(response)
    data = data.concat(handler(response))
  }
  log.success('ok')
  return data
}

exports.destructureIssue = issue => {
  const {
    user: {login}, title, number, state, comments, reactions, pull_request,
    repository_url, created_at
  } = issue
  const [,,,,owner, repo] = repository_url.split('/')
  return {
    owner,
    repo,
    user: login,
    title,
    number,
    state,
    comments,
    reactions,
    created_at,
    is_pr: !!pull_request
  }
}

exports.destructureComment = comment => {
  const {user: {login}, created_at} = comment
  return {
    user: login,
    created_at
  }
}

exports.destructureReview = review => {
  const {user: {login}, state, submitted_at} = review
  return {
    user: login,
    state,
    submitted_at
  }
}

const parseColon = (str, v) => {
  const [label, value] = str.split(':').map(d => d.trim())
  return {[label]: v ? v : value}
}

const parseAuthor = str => {
  const [ratio, ...nv] = str.trim().split(/\s+/).reverse()
  const [value, ...name] = nv.reverse()
  return {
    name: name.join(' '),
    value,
    ratio
  }
}

exports.parseSummaryCommit = summary => {
  const [
    project, age, active, commits, files, authorLabel, ...authors
  ] = summary.trim().split('\n')
  return {
    ...parseColon(project),
    ...parseColon(commits),
    ...parseColon(files),
    ...parseColon(authorLabel, authors.map(parseAuthor))
  }
}

exports.parseSummaryLine = summary => {
  const [project, lines, authorLabel, ...authors] = summary.trim().split('\n')
  return {
    ...parseColon(project),
    ...parseColon(lines),
    ...parseColon(authorLabel, authors.map(parseAuthor))
  }
}
