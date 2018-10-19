# xprt

git, github 에 기여한 내역을 데이터로 만들기.

## prerequisites

* nodejs :arrow_up: `v8.0.0`
* git :arrow_up: `v2.0.0`
* [git-extras](https://github.com/tj/git-extras)

## install

```
$ npm install -g xprt
```
## commands

### `git <repos_dir>`

[git summary](https://github.com/tj/git-extras/blob/master/Commands.md#git-summary) 명령어를 `repos_dir` 디렉토리에 위치한 저장소별로 수행하고, json (`git.json`) 으로 저장합니다.

<details>
<summary>example</summary>

```json
[
  {
    "project": "firejabber",
    "commits": "163",
    "files": "19",
    "lines": "3157",
    "authors": {
      "commit": [
        {
          "name": "chitacan",
          "value": "163",
          "ratio": "100.0%"
        }
      ],
      "line": [
        {
          "name": "chitacan",
          "value": "3157",
          "ratio": "100.0%"
        }
      ]
    }
  },
  ...
]
```

</details>

### `github`

작성한 (`authored`) 이슈, 코멘트 (`commented`), 리뷰 (`reviewed`) 를 선택한 github org 에서 가져와 json (`github.json`) 으로 저장합니다.

<details>
<summary>example</summary>

```json
{
  "authored": [{
    "owner": "awesome",
    "repo": "ohno",
    "user": "chitacan",
    "title": "hooray",
    "number": 48,
    "state": "closed",
    "comments": 1,
    "reactions": {
      "url": "https://api.github.com/repos/awesome/ohno/issues/48/reactions",
      "total_count": 0,
      "+1": 0,
      "-1": 0,
      "laugh": 0,
      "hooray": 0,
      "confused": 0,
      "heart": 0
    },
    "created_at": "2015-04-08T07:35:11Z",
    "is_pr": true
  }, ...],
  "commented": [{
    "owner": "awesome",
    "repo": "ohno",
    "user": "chitacan",
    "title": "hooray",
    "number": 48,
    "state": "closed",
    "comments": [
      {
        "user": "chitacan",
        "created_at": "2015-02-23T08:25:12Z"
      }
    ],
    "reactions": {
      "url": "https://api.github.com/repos/awesome/ohno/issues/48/reactions",
      "total_count": 0,
      "+1": 0,
      "-1": 0,
      "laugh": 0,
      "hooray": 0,
      "confused": 0,
      "heart": 0
    },
    "created_at": "2015-02-23T08:14:34Z",
    "is_pr": true
  }, ...],
  "reviewed": [{
    "owner": "awesome",
    "repo": "ohno",
    "user": "chitacan",
    "title": "i'm hyped",
    "number": 48,
    "state": "open",
    "comments": 2,
    "reactions": {
      "url": "https://api.github.com/repos/awesome/ohno/issues/48/reactions",
      "total_count": 0,
      "+1": 0,
      "-1": 0,
      "laugh": 0,
      "hooray": 0,
      "confused": 0,
      "heart": 0
    },
    "created_at": "2018-10-08T10:00:38Z",
    "is_pr": true,
    "reviews": [{
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T02:18:31Z"
    }, {
      "user": "chitacan",
      "state": "CHANGES_REQUESTED",
      "submitted_at": "2018-10-10T05:41:45Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:31:57Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:32:25Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:32:38Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:32:58Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:33:12Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:33:52Z"
    }, {
      "user": "chitacan",
      "state": "COMMENTED",
      "submitted_at": "2018-10-10T11:36:17Z"
    }]
  }, ...]
}
```

</details>

### `share <files...>`

`files` 에 해당하는 파일들을 `private gist` 에 저장합니다.

## why?

https://beta.observablehq.com/@chitacan/summary-of-my-github-org-contributions
