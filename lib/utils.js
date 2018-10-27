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

const gqlStarred = async (github, user, after = null) => {
  const response = await github.request({
    method: 'POST',
    url: '/graphql',
    query: `
      query Star($user: String!, $after: String) {
        user(login: $user) {
          starredRepositories(first: 100, after: $after) {
            pageInfo {
              endCursor
              hasNextPage
            }
            totalCount
            edges {
              starredAt
              node {
                name
                url
                languages(first: 50) {
                  nodes {
                    name
                  }
                }
                repositoryTopics(first: 50) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      user,
      after
    }
  })
  .then(d => d.data)

  if (response.errors) {
    if (response.errors.length === 1) {
      throw new Error(response.errors[0].message)
    } else {
      throw new Error("got multiple errors on 'Star' query. :(")
    }
  }

  return response.data
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

exports.paginateStarred = async (github, user, log) => {
  let {
    user: {
      starredRepositories: {
        pageInfo: {
          endCursor,
          hasNextPage
        },
        totalCount,
        edges
      }
    }
  } = await gqlStarred(github, user)
  while (hasNextPage) {
    const {user: {starredRepositories}} = await gqlStarred(github, user, endCursor)
    hasNextPage = starredRepositories.pageInfo.hasNextPage
    endCursor = starredRepositories.pageInfo.endCursor
    edges = edges.concat(starredRepositories.edges)
    log.pending('fetching [%d/%d]', edges.length, totalCount)
  }
  log.success('ok')
  return edges
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

exports.destructureStarred = starred => {
  const {starredAt, node: {name, url, languages, repositoryTopics}} = starred
  return {
    starredAt,
    name,
    url,
    languages: languages.nodes,
    topics: repositoryTopics.nodes
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
