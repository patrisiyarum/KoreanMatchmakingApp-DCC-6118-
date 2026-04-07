import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gameContentPath = join(__dirname, '../../config/game-content.json');
const gameContent = JSON.parse(readFileSync(gameContentPath, 'utf8'));

const TERM_POOLS = gameContent.termPools;
const GRAMMAR_POOLS = gameContent.grammarPools;
const PRONUNCIATION_POOLS = gameContent.pronunciationPools;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTermMatchingRound(difficulty = 'Beginner', count = 6) {
  const pool = TERM_POOLS[difficulty] || TERM_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  const pairs = selected.map((t, i) => ({ id: i, korean: t.korean, english: t.english }));
  return {
    pairs,
    shuffledEnglish: shuffle(pairs.map(p => ({ id: p.id, english: p.english }))),
  };
}

export function gradeTermMatching(pairs, answers) {
  let correct = 0;
  for (const answer of answers) {
    const pair = pairs.find(p => p.id === answer.id);
    if (pair && pair.english === answer.english) correct++;
  }
  return { correct, total: pairs.length, score: Math.round((correct / pairs.length) * 100) };
}

export function getGrammarQuizRound(difficulty = 'Beginner', count = 5) {
  const pool = GRAMMAR_POOLS[difficulty] || GRAMMAR_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  return selected.map((q, i) => ({
    id: i,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}

export function gradeGrammarQuiz(difficulty, questions, answers) {
  const pool = GRAMMAR_POOLS[difficulty] || GRAMMAR_POOLS.Beginner;
  let correct = 0;
  const results = questions.map((q, i) => {
    const original = pool.find(p => p.question === q.question);
    const userAnswer = answers[i];
    const isCorrect = original && userAnswer === original.correctIndex;
    if (isCorrect) correct++;
    return {
      id: q.id,
      correct: isCorrect,
      correctAnswer: original ? original.correctIndex : null,
      explanation: original ? original.explanation : '',
    };
  });
  return { correct, total: questions.length, score: Math.round((correct / questions.length) * 100), results };
}

export function getPronunciationDrillRound(difficulty = 'Beginner', count = 5) {
  const pool = PRONUNCIATION_POOLS[difficulty] || PRONUNCIATION_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  return selected.map((p, i) => ({
    id: i,
    korean: p.korean,
    romanization: p.romanization,
    english: p.english,
  }));
}
