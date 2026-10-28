// UI: renders the guess grid, keyboard and results; all word logic is in solver.js.
import { solve, letterStatus } from './solver.js';

const MAX_ROWS = 6;
const NEXT_COLOR = { b: 'y', y: 'g', g: 'b' };
const COLOR_NAMES = { b: 'gray', y: 'yellow', g: 'green' };
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-']; // + = enter, - = backspace

const state = {
  rows: [], // submitted guesses: [{ word, pattern }]
  letters: '', // the row being typed
  colors: ['b', 'b', 'b', 'b', 'b'],
};
let lists = null; // { official: [...], other: [...] }
let knownWords = new Set();

const $ = (id) => document.getElementById(id);
const els = {
  board: $('board'),
  message: $('message'),
  keyboard: $('keyboard'),
  undo: $('undo'),
  reset: $('reset'),
  summary: $('summary'),
  suggestions: $('suggestions'),
};

const isSolved = () => state.rows.at(-1)?.pattern === 'ggggg';
const canType = () => lists && !isSolved() && state.rows.length < MAX_ROWS;

// ---- Actions ----

function addLetter(letter) {
  if (!canType() || state.letters.length >= 5) return;
  state.colors[state.letters.length] = 'b';
  state.letters += letter;
  setMessage('');
  render();
}

function removeLetter() {
  if (!canType() || !state.letters) return;
  state.letters = state.letters.slice(0, -1);
  setMessage('');
  render();
}

function cycleColor(i) {
  state.colors[i] = NEXT_COLOR[state.colors[i]];
  render();
}

function submitRow() {
  if (!canType()) return;
  if (state.letters.length < 5) {
    setMessage('Enter all 5 letters first.');
    return;
  }
  const word = state.letters;
  state.rows.push({ word, pattern: state.colors.join('') });
  state.letters = '';
  state.colors = ['b', 'b', 'b', 'b', 'b'];

  if (isSolved()) setMessage(`Solved in ${state.rows.length}!`);
  else if (!knownWords.has(word)) setMessage(`“${word.toUpperCase()}” isn’t in our word list, but it was used anyway.`);
  else setMessage('');
  render();
}

function fillWord(word) {
  if (!canType()) return;
  state.letters = word;
  state.colors = ['b', 'b', 'b', 'b', 'b'];
  setMessage('Now tap the tiles to set the colors Wordle gave you.');
  render();
}

function undo() {
  const last = state.rows.pop();
  if (!last) return;
  state.letters = last.word;
  state.colors = [...last.pattern];
  setMessage('');
  render();
}

function reset() {
  state.rows = [];
  state.letters = '';
  state.colors = ['b', 'b', 'b', 'b', 'b'];
  setMessage('');
  render();
}

function setMessage(text) {
  els.message.textContent = text;
}

// ---- Rendering ----

function render() {
  renderBoard();
  renderKeyboard();
  renderResults();
  els.undo.disabled = state.rows.length === 0;
}

function tile(letter, color, extraClass = '') {
  const el = document.createElement('div');
  el.className = `tile ${color ? `c-${color}` : ''} ${extraClass}`;
  el.textContent = letter;
  return el;
}

function renderBoard() {
  els.board.replaceChildren();
  const activeRow = canType() ? state.rows.length : -1;

  for (let r = 0; r < MAX_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'row';

    if (r < state.rows.length) {
      const { word, pattern } = state.rows[r];
      for (let i = 0; i < 5; i++) row.append(tile(word[i], pattern[i]));
      row.append(spacer());
    } else if (r === activeRow) {
      row.classList.add('active');
      for (let i = 0; i < 5; i++) {
        const letter = state.letters[i];
        if (letter) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `tile c-${state.colors[i]}`;
          btn.textContent = letter;
          btn.setAttribute('aria-label', `${letter.toUpperCase()}, ${COLOR_NAMES[state.colors[i]]}. Tap to change color.`);
          btn.addEventListener('click', () => cycleColor(i));
          row.append(btn);
        } else {
          row.append(tile('', null, 'empty'));
        }
      }
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'submit';
      submit.textContent = '✓';
      submit.setAttribute('aria-label', 'Submit this row');
      submit.disabled = state.letters.length < 5;
      submit.addEventListener('click', submitRow);
      row.append(submit);
    } else {
      for (let i = 0; i < 5; i++) row.append(tile('', null, 'empty'));
      row.append(spacer());
    }
    els.board.append(row);
  }
}

function spacer() {
  const el = document.createElement('div');
  el.className = 'submit-spacer';
  return el;
}

function buildKeyboard() {
  for (const keys of KEY_ROWS) {
    const row = document.createElement('div');
    row.className = 'key-row';
    for (const k of keys) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key';
      if (k === '+') {
        btn.textContent = 'Enter';
        btn.dataset.key = 'Enter';
        btn.classList.add('wide');
      } else if (k === '-') {
        btn.textContent = '⌫';
        btn.dataset.key = 'Backspace';
        btn.setAttribute('aria-label', 'Backspace');
        btn.classList.add('wide');
      } else {
        btn.textContent = k;
        btn.dataset.key = k;
      }
      row.append(btn);
    }
    els.keyboard.append(row);
  }
  els.keyboard.addEventListener('click', (e) => {
    const key = e.target.closest('.key')?.dataset.key;
    if (key) handleKey(key);
  });
}

function renderKeyboard() {
  const status = letterStatus(state.rows);
  for (const btn of els.keyboard.querySelectorAll('.key')) {
    const color = status[btn.dataset.key];
    btn.classList.remove('c-g', 'c-y', 'c-b');
    if (color) btn.classList.add(`c-${color}`);
  }
}

function renderResults() {
  if (!lists) return;
  const { officialCount, otherCount, top } = solve(lists, state.rows);
  const fmt = (n) => n.toLocaleString();

  if (state.rows.length === 0) {
    els.summary.textContent = `${fmt(officialCount)} likely answers. Good words to start with:`;
  } else if (officialCount + otherCount === 0) {
    els.summary.textContent = 'No words match. Double-check the colors on each row.';
  } else if (officialCount === 0) {
    els.summary.textContent = `No likely answers left, but ${fmt(otherCount)} other word${otherCount === 1 ? '' : 's'} match:`;
  } else {
    const others = otherCount ? ` (plus ${fmt(otherCount)} less common word${otherCount === 1 ? '' : 's'})` : '';
    els.summary.textContent = `${fmt(officialCount)} likely answer${officialCount === 1 ? '' : 's'}${others}.`;
  }

  els.suggestions.replaceChildren();
  for (const { word, score, official } of top) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion';
    btn.innerHTML = `<span class="word"></span>${official ? '<span class="badge">likely</span>' : ''}<span class="score"></span>`;
    btn.querySelector('.word').textContent = word;
    btn.querySelector('.score').textContent = score;
    btn.setAttribute('aria-label', `Try ${word}${official ? ', likely answer' : ''}, score ${score}`);
    btn.disabled = !canType();
    btn.addEventListener('click', () => fillWord(word));
    li.append(btn);
    els.suggestions.append(li);
  }
}

// ---- Input ----

function handleKey(key) {
  if (key === 'Enter') submitRow();
  else if (key === 'Backspace') removeLetter();
  else if (/^[a-z]$/.test(key)) addLetter(key);
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === 'Enter' || key === 'Backspace' || /^[a-z]$/.test(key)) {
    // Stops Enter from also "clicking" whichever on-screen button has focus.
    e.preventDefault();
    handleKey(key);
  }
});

els.undo.addEventListener('click', undo);
els.reset.addEventListener('click', reset);

async function init() {
  buildKeyboard();
  render();
  try {
    const res = await fetch('words.json');
    if (!res.ok) throw new Error(res.statusText);
    lists = await res.json();
    knownWords = new Set([...lists.official, ...lists.other]);
  } catch (err) {
    els.summary.textContent = `Couldn’t load the word list (${err.message}).`;
    return;
  }
  render();
}

init();
