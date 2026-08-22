import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCheckoutHexColor } from './checkout-visual.ts';

test('normaliza cores com e sem cerquilha', () => {
  assert.equal(normalizeCheckoutHexColor('#ef4444'), '#EF4444');
  assert.equal(normalizeCheckoutHexColor('ef4444'), '#EF4444');
});

test('expande shorthand e remove canal alpha', () => {
  assert.equal(normalizeCheckoutHexColor('#f43'), '#FF4433');
  assert.equal(normalizeCheckoutHexColor('#EF4444CC'), '#EF4444');
});

test('rejeita cores inválidas', () => {
  assert.equal(normalizeCheckoutHexColor('red'), undefined);
  assert.equal(normalizeCheckoutHexColor('#12'), undefined);
  assert.equal(normalizeCheckoutHexColor(''), undefined);
});
