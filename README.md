# wordle_solver

A static web page that helps people who are stuck on the NYT Wordle. Enter each guess, tap the tiles to match the colors Wordle gave, and it lists the words that are still possible, ranked by score.

No server code or database: everything runs in the browser from `site/`.

## Layout

| Path | What it is |
| --- | --- |
| `data/` | Source word lists (see below) |
| `scripts/build_words.js` | Turns the word lists into `site/words.json` |
| `scripts/serve.js` | Tiny local web server for development |
| `site/` | The website: this folder is what gets uploaded |
| `site/solver.js` | Word logic (colors, filtering, scoring), no UI code |
| `site/app.js` | The UI: grid, keyboard, results |
| `test/` | Tests for `solver.js` |

## Commands

Requires Node.js (no packages to install).

```
npm run build   # rebuild site/words.json after changing anything in data/
npm test        # run the solver tests
npm start       # serve the site at http://localhost:8000
```

Opening `site/index.html` directly from disk won't work, because browsers block loading `words.json` from a `file://` page. Use `npm start`.

## Scoring (version 1)

After each guess, the remaining *official* words are used to count how many contain each letter (a repeated letter counts once per word). A word's score is the sum of those counts for its unique letters. Official words are listed first, marked "likely". If none fit, the other words are scored instead.

## Deploying

Upload the contents of `site/` to the folder your subdomain points at.

## Word list sources

The "official" words came from https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b#file-wordle-answers-alphabetical-txt

The all 5 letter words came from https://raw.githubusercontent.com/tabatkins/wordle-list/main/words
