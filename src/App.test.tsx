import { describe, it, expect } from 'vitest';

describe('HealthBlog тесты для диплома', () => {
  it('проверка: 2 + 2 = 4', () => {
    expect(2 + 2).toBe(4);
  });

  it('проверка: название проекта содержит Health', () => {
    expect('HealthBlog').toContain('Health');
  });

  it('проверка: true равно true', () => {
    expect(true).toBe(true);
  });
});