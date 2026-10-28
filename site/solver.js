// Pure solver logic: no DOM access, so it can be tested with `node --test`.
//
// A pattern is a 5-character string of feedback colors:
//   'g' = green (right letter, right spot)
//   'y' = yellow (letter is in the word, wrong spot)
//   'b' = gray/black (no more of this letter in the word)

const RANK = { b: 0, y: 1, g: 2 };

// The colors Wordle would show for `guess` if the answer were `answer`.
// Greens are matched first; then each remaining answer letter can turn at
// most one guess letter yellow, which is how duplicate letters are handled.
export function pattern(guess, answer) {
  const result = ['b', 'b', 'b', 'b', 'b'];
  const unmatched = {};

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = 'g';
    else unmatched[answer[i]] = (unmatched[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'g' && unmatched[guess[i]] > 0) {
      result[i] = 'y';
      unmatched[guess[i]]--;
    }
  }
  return result.join('');
}

// Words that would have produced exactly the feedback in every row.
// rows: [{ word: 'crane', pattern: 'bygbb' }, ...]
export function filterCandidates(words, rows) {
  return words.filter((w) => rows.every((r) => pattern(r.word, w) === r.pattern));
}

// For each letter, how many of `words` contain it (a repeated letter counts once).
export function letterScores(words) {
  const scores = {};
  for (const word of words) {
    for (const letter of new Set(word)) scores[letter] = (scores[letter] || 0) + 1;
  }
  return scores;
}

export function scoreWord(word, scores) {
  let total = 0;
  for (const letter of new Set(word)) total += scores[letter] || 0;
  return total;
}

// Highest score first; alphabetical among ties so results are stable.
export function rank(words, scores) {
  return words
    .map((word) => ({ word, score: scoreWord(word, scores) }))
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
}

// Everything the UI needs after a set of guesses.
// Letter scores come from the remaining official words (the likely answers),
// falling back to the other words when no official word fits.
export function solve({ official, other }, rows, limit = 20) {
  const officialLeft = filterCandidates(official, rows);
  const otherLeft = filterCandidates(other, rows);
  const scores = letterScores(officialLeft.length ? officialLeft : otherLeft);

  const top = rank(officialLeft, scores)
    .slice(0, limit)
    .map((s) => ({ ...s, official: true }));
  if (top.length < limit) {
    const extra = rank(otherLeft, scores).slice(0, limit - top.length);
    top.push(...extra.map((s) => ({ ...s, official: false })));
  }

  return { officialCount: officialLeft.length, otherCount: otherLeft.length, top };
}

// Best-known color for each letter guessed so far, for coloring the keyboard.
// Green beats yellow beats gray, so a gray duplicate never hides a green.
export function letterStatus(rows) {
  const status = {};
  for (const { word, pattern: p } of rows) {
    for (let i = 0; i < 5; i++) {
      const letter = word[i];
      if (!(letter in status) || RANK[p[i]] > RANK[status[letter]]) status[letter] = p[i];
    }
  }
  return status;
}
