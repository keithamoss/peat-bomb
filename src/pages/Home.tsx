import {
  Box,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  Link,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Autocomplete from '@material-ui/lab/Autocomplete'
import React, { ChangeEvent, Fragment, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { default as DotsChart } from './dots'
interface RedditPost {
  data: {
    title: string
    url: string
    permalink: string
    name: string
  }
}

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
}))

const isReviewPost = (item: RedditPost) => {
  return ['review #', 'bottle review #'].some((test: string) => {
    return item.data.title.toLowerCase().startsWith(test)
  })
}

const isReviewPostFuzzy = (item: RedditPost) => {
  return ['review #', 'review ', 'bottle review #'].some((test: string) => {
    return item.data.title.toLowerCase().includes(test)
  })
}

const normaliseScore = (score: string) => {
  console.log('normaliseScore', score)
  // let scoreNorm = score
  let tmp = null

  // Individual ratings e.g. Rating: 70, Rating: 8
  if (score.search(/^[0-9]{1,}$/g) !== -1) {
    tmp = Number(score)
    // scoreNorm = tmp <= 10 ? `${tmp}/10` : `${tmp}/100`
    // console.log('#', score, scoreNorm)
    return Number(tmp <= 10 ? tmp : tmp / 10)
  }

  // Scores out of X e.g. 70/100, 8/10
  if (score.search(/^[0-9.]{1,}\/[0-9]{3}$/g) !== -1) {
    tmp = score.split('/')
    const tmp2 = Number(tmp[0])
    // const tmp3 = Number(tmp[1])
    // scoreNorm = `${tmp2 / 10}/${tmp3 / 10}`
    // console.log('!', score, scoreNorm)
    return Number(tmp2 <= 10 ? tmp2 : tmp2 / 10)
  }

  // @TODO Validate out of 10 so we can throw out weird stuff like "1/2 a shot"

  // Catch and log
  return null

  // if (scoreNorm.search(/[0-9.]{1,}\/10/g) !== -1) {
  //   console.log('>', score, scoreNorm)
  //   return Number(scoreNorm.split('/')[0])
  // } else {
  //   // Catch and log
  //   return null
  // }
}

const extractReviewTitle = (item: RedditPost, searchTerm: string) => {
  return item.data.title.substring(
    item.data.title.toLowerCase().indexOf(searchTerm.toLowerCase())
  )
}

function reducer(state: number[], score: number | null) {
  if (score !== null) {
    return [...state, score]
  }
  return []
}

export const Home: React.FC = () => {
  const classes = useStyles()

  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<string[]>([])
  const [searchTermRaw, setSearchTerm] = React.useState<string | null>(null)
  const [choice, setChoice] = React.useState<string | null>(null)
  const [scores, setScores] = React.useReducer(reducer, [])

  const [searchTerm] = useDebounce(searchTermRaw, 500)
  const loading = open && options.length === 0

  const getScore = useCallback(
    (item: RedditPost, postId: string) => {
      ;(async () => {
        const response = await fetch(
          `https://www.reddit.com/comments/${postId}/.json`
        )
        const thread = await response.json()
        console.log('thread', thread)
        // console.log('thread', thread[1].data.children[0].data.body)

        let matches = thread[1].data.children[0].data.body.match(
          /[0-9.]{1,}\/[0-9]{1,3}/g
        )

        if (matches === null) {
          matches = thread[1].data.children[0].data.body.match(
            /Rating: [0-9.]{1,}/g
          )
          if (matches !== null) {
            matches = matches.map((match: string) => {
              return match.replace('Rating: ', '')
            })
          }
        }

        if (matches !== null) {
          const score = matches[matches.length - 1]
          const scoreNorm = normaliseScore(score)
          console.log(item.data.title, 'Score', scoreNorm)
          console.log(`https://www.reddit.com${item.data.permalink}`)
          if (scoreNorm !== null) {
            setScores(scoreNorm)
          }
        } else {
          console.log('thread', thread[1].data.children[0].data.body)
          console.log(item.data.title, 'No match')
          return null
        }
      })()
    },
    [setScores]
  )

  React.useEffect(() => {
    let active = true
    // console.log('Searching for', searchTerm)

    if (searchTerm === null) {
      return undefined
    }

    ;(async () => {
      const response = await fetch(
        `https://www.reddit.com/r/scotch/search.json?q=title:review%20AND%20${searchTerm}&sort=new&restrict_sr=1&limit=100`
      )
      const reddit = await response.json()
      const reviews: string[] = []

      console.log(
        'Found n items',
        reddit.data.children.length,
        'for',
        searchTerm
      )
      if (reddit.data.children.length === 0) {
        if (active) {
          setOptions([''])
        }
      } else {
        reddit.data.children.forEach((item: RedditPost) => {
          if (
            isReviewPost(item) &&
            item.data.title.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            reviews.push(extractReviewTitle(item, searchTerm))
          } else {
            // console.log('SKIP', item.data.title)
          }
        })

        reviews.sort((a: string, b: string) => {
          return a.length - b.length
        })

        if (active) {
          setOptions(Array.from(new Set(reviews)))
        }
      }
    })()

    return () => {
      active = false
    }
  }, [loading, searchTerm])

  React.useEffect(() => {
    if (!open) {
      setOptions([])
    }
  }, [open])

  React.useEffect(() => {
    if (choice !== null) {
      // console.log('Choice is now', choice)

      ;(async () => {
        const response = await fetch(
          `https://www.reddit.com/r/scotch/search.json?q=title:review%20AND%20${choice}&sort=new&restrict_sr=1&limit=100`
        )
        const reddit = await response.json()

        const reviews: RedditPost[] = []
        reddit.data.children.forEach((item: RedditPost) => {
          if (
            isReviewPostFuzzy(item) &&
            item.data.title.toLowerCase().includes(choice.toLowerCase())
          ) {
            // console.log('OK', item.data.title)
            reviews.push(item)
          } else {
            console.log('SKIP', item.data.title)
          }
        })

        console.log('# Fetch scores for', reviews.length, 'items')
        reviews.forEach((item: RedditPost) => {
          const postId = item.data.name.split('t3_')[1]

          if (
            postId === '4pahzq' ||
            postId === 'as7w3b' ||
            postId === '4w748u' ||
            postId.length > 0
          ) {
            console.log(item.data.title)
            console.log(item.data.name, postId)
            console.log(`https://www.reddit.com${item.data.permalink}`)
            console.log(item.data)
            const score = getScore(item, postId)
            console.log(score)
          }
        })
      })()
    }
  }, [choice, getScore])

  // React.useEffect(() => {
  //   if (scores.length > 0) {
  //     console.log('State Scores', scores)
  //   }
  // }, [scores])

  return (
    <Fragment>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          {/* <DotsChart
            width={400}
            height={80}
            points={[8.3, 8.6, 8, 9.3, 8.8, 9.5, 9.3, 9.5, 9.3, 9.4, 9, 9.4]}
          /> */}
          <Typography component="h1" variant="h1">
            <span role="img" aria-label="Whisky glass image">
              🥃
            </span>
          </Typography>
          <form className={classes.form} noValidate>
            <Autocomplete
              id="asynchronous-demo"
              blurOnSelect
              open={open}
              onClose={() => {
                setOpen(false)
              }}
              onInputChange={(event: object, value: string, reason: string) => {
                // console.log(reason, value)
                if (value.length >= 5) {
                  setSearchTerm(value)
                  if (reason === 'input') {
                    setOpen(true)
                  }
                }
              }}
              onChange={(event: ChangeEvent<{}>, value: string | null) => {
                setChoice(value)
                setScores(null)
              }}
              getOptionSelected={(option, value) => option === value}
              getOptionLabel={option => option}
              options={options}
              loading={loading}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Search for whisky reviews"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
            <Grid container style={{ marginTop: 25 }}>
              <Grid item style={{ width: '100%' }}>
                {choice !== null && scores.length > 0 && (
                  <DotsChart maxWidth={400} height={80} points={scores} />
                )}
              </Grid>
              <Grid item xs>
                <Link
                  href="https://www.reddit.com/r/Scotch/"
                  variant="overline"
                  display="block"
                  align="center"
                >
                  /r/Skotch{' '}
                  <span role="img" aria-label="Whisky glass image">
                    ❤️
                  </span>
                </Link>
              </Grid>
              <Grid item>
                {/* <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link> */}
              </Grid>
            </Grid>
          </form>
        </div>
        <Box mt={8}>{/* <Copyright /> */}</Box>
      </Container>
    </Fragment>
  )
}
