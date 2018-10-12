const {outputJsonSync} = require('fs-extra')
const {Signale, fatal} = require('signale')
const {prompt} = require('inquirer')
const {
  paginate,
  destructureIssue,
  destructureComment,
  destructureReview
} = require('./utils')
const auth = require('./auth')

const authoredLog = new Signale({interactive: true, scope: 'authored'})
const reviewedLog = new Signale({interactive: true, scope: 'reviewed'})
const commentedLog = new Signale({interactive: true, scope: 'commented'})
const resultLog = new Signale({scope: 'result'})

module.exports = async () => {
  try {
    const github = await auth()
    const user = await github.users.get().then(d => d.data.login)
    const orgs = await github.users.getOrgs()
      .then(d => d.data.map(org => org.login))

    const {org} = await prompt({
      type: 'list',
      message: 'select organization to export',
      name: 'org',
      choices: orgs
    })

    authoredLog.info('fetching issues authored by me')
    const authored = await paginate(
      github,
      github.search.issues,
      {q: `org:${org} author:${user}`},
      (res) => res.data.items,
      authoredLog
    )
    .then(issues => issues.map(destructureIssue))

    reviewedLog.info('fetching issues reviewed by me')
    const reviewed = await paginate(
      github,
      github.search.issues,
      {q: `org:${org} reviewed-by:${user}`},
      (res) => res.data.items,
      reviewedLog
    )
    .then(prs => prs.map(destructureIssue))
    .then(async prs => {
      const result = []
      const total = prs.ength
      for(const [i, pr] of prs.entries()) {
        const {owner, repo, number} = pr
        reviewedLog.info('fetching reviews of #%d (%d/%d)', number, i, total)
        const reviews = await paginate(
          github,
          github.pullRequests.getReviews,
          {owner, repo, number},
          undefined,
          reviewedLog
        )
        .then(reviews => reviews.map(destructureReview))
        result.push({
          ...pr,
          reviews
        })
      }
      return result
    })

    commentedLog.info('fetching issues commented by me')
    const commented = await paginate(
      github,
      github.search.issues,
      {q: `org:${org} commenter:${user}`},
      (res) => res.data.items,
      commentedLog
    )
    .then(issues => issues.map(destructureIssue))
    .then(async issues => {
      const result = []
      const total = issues.length
      for (const [i, issue] of issues.entries()) {
        const {owner, repo, number} = issue
        commentedLog.info('fetching comments of #%d (%d/%d)', number, i, total)
        const comments = await paginate(
          github,
          github.issues.getComments,
          {owner, repo, number},
          undefined,
          commentedLog
        )
        .then(comments => comments.map(destructureComment))
        result.push({
          ...issue,
          comments
        })
      }
      return result
    })

    resultLog.fav(
      'authored (t/i/p): %d/%d/%d',
      authored.length,
      authored.filter(d => !d.is_pr).length,
      authored.filter(d => d.is_pr).length
    )
    resultLog.fav('reviewed: %d', reviewed.length)
    resultLog.fav(
      'commented (t/i/p): %d/%d/%d',
      commented.length,
      commented.filter(d => !d.is_pr).length,
      commented.filter(d => d.is_pr).length
    )
    outputJsonSync('github.json', {authored, commented, reviewed}, {spaces: 2})
    resultLog.success('result saved on "github.json"')
  } catch (err) {
    fatal(err)
  }
}
