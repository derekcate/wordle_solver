import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pattern,
  filterCandidates,
  letterScores,
  scoreWord,
  solve,
  letterStatus,
} from '../site/solver.js';

test('pattern: exact match is all green', () => {
  assert.equal(pattern('crane', 'crane'), 'ggggg');
});

test('pattern: no shared letters is all gray', () => {
  assert.equal(pattern('crane', 'moldy'), 'bbbbb');
});

test('pattern: duplicate in guess, single in answer -> only one yellow', () => {
  // SPEED vs ABIDE: answer has one E, so only the first E is yellow.
  assert.equal(pattern('speed', 'abide'), 'bbyby');
});

test('pattern: green is matched before yellow', () => {
  // ROBOT vs FLOOR: the second O is green, which uses up one of the two Os.
  assert.equal(pattern('robot', 'floor'), 'yybgb');
});

test('pattern: green uses up the letter so a later duplicate is gray', () => {
  // EERIE vs ENTER: answer has two Es; one green, one yellow, third gray.
  assert.equal(pattern('eerie', 'enter'), 'gyybb');
});

test('pattern: duplicate in answer, single in guess', () => {
  assert.equal(pattern('stare', 'geese'), 'ybbbg');
});

test('filterCandidates keeps only words consistent with every row', () => {
  const words = ['abide', 'dense', 'eider', 'crane'];
  const rows = [{ word: 'speed', pattern: pattern('speed', 'abide') }];
  assert.deepEqual(filterCandidates(words, rows), ['abide']);
});

test('letterScores counts a repeated letter once per word', () => {
  const scores = letterScores(['speed', 'sleep']);
  assert.equal(scores.e, 2);
  assert.equal(scores.s, 2);
  assert.equal(scores.d, 1);
});

test('scoreWord sums unique letters only', () => {
  const scores = { s: 10, p: 5, e: 3, d: 1 };
  assert.equal(scoreWord('speed', scores), 19);
});

test('solve lists official words first and fills with others', () => {
  const lists = { official: ['crane', 'crate'], other: ['crake', 'zzzzz'] };
  const rows = [{ word: 'crabs', pattern: 'gggbb' }];
  const result = solve(lists, rows, 5);
  assert.equal(result.officialCount, 2);
  assert.equal(result.otherCount, 1);
  assert.deepEqual(
    result.top.map((t) => [t.word, t.official]),
    [['crane', true], ['crate', true], ['crake', false]],
  );
});

test('solve falls back to other words when no official word fits', () => {
  const lists = { official: ['crane'], other: ['zowie'] };
  const rows = [{ word: 'zowie', pattern: 'ggggg' }];
  const result = solve(lists, rows);
  assert.equal(result.officialCount, 0);
  assert.deepEqual(result.top, [{ word: 'zowie', score: 5, official: false }]);
});

test('letterStatus keeps the best color for a letter', () => {
  const status = letterStatus([
    { word: 'speed', pattern: 'bbbgb' },
    { word: 'eerie', pattern: 'bybbb' },
  ]);
  assert.equal(status.e, 'g');
  assert.equal(status.r, 'b');
  assert.equal(status.s, 'b');
});
