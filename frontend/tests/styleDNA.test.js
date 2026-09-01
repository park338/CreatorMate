import test from 'node:test'
import assert from 'node:assert/strict'

import {
  STYLE_DIMENSIONS,
  contentFingerprint,
  createEmptyStyleDNA,
  getStyleStage,
  isMeaningfulStyleSample,
  mergeStyleSample,
} from '../src/utils/styleDNA.js'

function analysis(score, keyword = '真实') {
  return {
    dimensions: Object.fromEntries(STYLE_DIMENSIONS.map((dimension) => [dimension, score])),
    keywords: [keyword],
    summary: `${keyword}表达`,
    evidence: Object.fromEntries(STYLE_DIMENSIONS.map((dimension) => [dimension, `${dimension}证据`])),
  }
}

test('new profiles start without a learned style', () => {
  const dna = createEmptyStyleDNA()

  assert.equal(dna.sampleCount, 0)
  assert.deepEqual(dna.dimensions, {})
  assert.equal(getStyleStage(dna), 'untrained')
})

test('the first confirmed draft creates a low-confidence preliminary profile', () => {
  const dna = mergeStyleSample(createEmptyStyleDNA(), analysis(64), '第一篇用户确认定稿，有足够长度用于风格分析。', '学生党', 'source-1')

  assert.equal(dna.sampleCount, 1)
  assert.equal(dna.status, 'learning')
  assert.equal(dna.confidence, '低')
  assert.equal(dna.dimensions.幽默, 64)
  assert.equal(dna.targetAudience, '学生党')
})

test('three samples use a deterministic running average and establish the profile', () => {
  const first = mergeStyleSample(createEmptyStyleDNA(), analysis(40, '第一'), '第一篇不同内容', '学生党', 'source-1')
  const second = mergeStyleSample(first, analysis(60, '第二'), '第二篇不同内容', '学生党', 'source-2')
  const third = mergeStyleSample(second, analysis(80, '第三'), '第三篇不同内容', '学生党', 'source-3')

  assert.equal(third.sampleCount, 3)
  assert.equal(third.status, 'established')
  assert.equal(third.confidence, '中')
  assert.equal(third.dimensions.专业, 60)
  assert.deepEqual(new Set(third.keywords), new Set(['第一', '第二', '第三']))
})

test('the same creation round cannot be submitted twice', () => {
  const first = mergeStyleSample(createEmptyStyleDNA(), analysis(50), '第一版定稿', '学生党', 'same-source')

  assert.throws(
    () => mergeStyleSample(first, analysis(70), '同一轮修改后的另一版', '学生党', 'same-source'),
    /本轮创作已经提交过/,
  )
})

test('raw AI output is not treated as a meaningful user sample', () => {
  const generated = '这是一段由AI生成的初稿内容，需要用户进一步修改后才能形成个人表达。'.repeat(3)
  const edited = generated.replaceAll('AI生成', '我亲自整理').replaceAll('进一步修改', '补充真实经历')

  assert.equal(isMeaningfulStyleSample(generated, generated), false)
  assert.equal(isMeaningfulStyleSample('太短了', ''), false)
  assert.equal(isMeaningfulStyleSample(edited, generated), true)
  assert.notEqual(contentFingerprint(edited), contentFingerprint(generated))
})
