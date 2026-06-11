// 개념 퀴즈(생식세포·수정) 문항 무결성 — 정답이 보기에 포함되고 보기는 서로 다른지.

import { describe, it, expect } from 'vitest';
import { pickConceptQuestion } from '../features/quiz/conceptQuiz';

describe('개념 퀴즈 문항 무결성', () => {
  it('500회 생성: 정답이 보기에 있고, 보기는 중복 없이 2개 이상, 텍스트 채워짐', () => {
    for (let i = 0; i < 500; i++) {
      const q = pickConceptQuestion();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options).toContain(q.answer);
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.explain.length).toBeGreaterThan(0);
      expect(['생식세포 다양성', '수정과 자손']).toContain(q.topic);
    }
  });
});
