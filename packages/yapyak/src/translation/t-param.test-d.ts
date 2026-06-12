import type { ExtractTParams } from './t-param';

import { describe, expectTypeOf, it } from 'vitest';

describe('ExtractTParams', () => {
  it('resolves `unknown` when the source has no placeholders', () => {
    expectTypeOf<ExtractTParams<'Save changes'>>().toEqualTypeOf<unknown>();
  });

  it('resolves a string-or-number param for a simple placeholder', () => {
    expectTypeOf<ExtractTParams<'Hello, {name}!'>>().toEqualTypeOf<{
      name: string | number;
    }>();
  });

  it('resolves params for multiple simple placeholders', () => {
    expectTypeOf<{
      a: 'x';
      b: 1;
    }>().toExtend<ExtractTParams<'{a} {b}'>>();
  });

  it('holds a plural argument as `number`', () => {
    type Result =
      ExtractTParams<'You have {count, plural, one {# message} other {# messages}}'>;
    expectTypeOf<{
      count: 3;
    }>().toExtend<Result>();
  });

  it('refuses a string for a plural argument', () => {
    type Result =
      ExtractTParams<'You have {count, plural, one {# message} other {# messages}}'>;
    expectTypeOf<{
      count: 'three';
    }>().not.toExtend<Result>();
  });

  it('holds a selectordinal argument as `number`', () => {
    type Result = ExtractTParams<'{n, selectordinal, one {1st} other {nth}}'>;
    expectTypeOf<{
      n: 1;
    }>().toExtend<Result>();
    expectTypeOf<{
      n: 'one';
    }>().not.toExtend<Result>();
  });

  it('holds a number argument as `number`', () => {
    type Result = ExtractTParams<'Price: {amount, number, currency EUR}'>;
    expectTypeOf<{
      amount: 10;
    }>().toExtend<Result>();
    expectTypeOf<{
      amount: 'ten';
    }>().not.toExtend<Result>();
  });

  it('holds a `number, percent` argument as `number`', () => {
    type Result = ExtractTParams<'Total: {amount, number, percent}'>;
    expectTypeOf<{
      amount: 0.42;
    }>().toExtend<Result>();
    expectTypeOf<{
      amount: 'ten';
    }>().not.toExtend<Result>();
  });

  it('holds a `number, integer` argument as `number`', () => {
    type Result = ExtractTParams<'Count: {amount, number, integer}'>;
    expectTypeOf<{
      amount: 42;
    }>().toExtend<Result>();
  });

  it('holds a bare `number` argument as `number`', () => {
    type Result = ExtractTParams<'Total: {amount, number}'>;
    expectTypeOf<{
      amount: 42;
    }>().toExtend<Result>();
    expectTypeOf<{
      amount: 'ten';
    }>().not.toExtend<Result>();
  });

  it('holds a bare `date` argument as `Date` or `number`', () => {
    type Result = ExtractTParams<'Updated: {when, date}'>;
    expectTypeOf<{
      when: Date;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 1700000000000;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 'today';
    }>().not.toExtend<Result>();
  });

  it('holds a bare `time` argument as `Date` or `number`', () => {
    type Result = ExtractTParams<'At: {when, time}'>;
    expectTypeOf<{
      when: Date;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 'now';
    }>().not.toExtend<Result>();
  });

  it('holds a date argument as `Date` or `number`', () => {
    type Result = ExtractTParams<'Updated: {when, date, long}'>;
    expectTypeOf<{
      when: Date;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 1700000000000;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 'today';
    }>().not.toExtend<Result>();
  });

  it('holds a time argument as `Date` or `number`', () => {
    type Result = ExtractTParams<'At: {when, time, short}'>;
    expectTypeOf<{
      when: Date;
    }>().toExtend<Result>();
    expectTypeOf<{
      when: 'now';
    }>().not.toExtend<Result>();
  });

  it('preserves known branches and any string for a select with `other`', () => {
    type Result =
      ExtractTParams<'{theme, select, dark {Dark mode} other {Light mode}}'>;
    expectTypeOf<{
      theme: 'dark';
    }>().toExtend<Result>();
    expectTypeOf<{
      theme: 'custom-theme';
    }>().toExtend<Result>();
    expectTypeOf<{
      theme: 42;
    }>().not.toExtend<Result>();
  });

  it('refuses a select without `other` outside its branch union', () => {
    type Result = ExtractTParams<'{gender, select, male {Mr.} female {Ms.}}'>;
    expectTypeOf<{
      gender: 'male';
    }>().toExtend<Result>();
    expectTypeOf<{
      gender: 'female';
    }>().toExtend<Result>();
    expectTypeOf<{
      gender: 'unknown';
    }>().not.toExtend<Result>();
  });

  it('holds only the selector for single-word select branches', () => {
    type Result =
      ExtractTParams<'{role, select, admin {Administrator} editor {Editor} other {Viewer}}'>;
    expectTypeOf<{
      role: 'editor';
    }>().toExtend<Result>();
    expectTypeOf<{
      role: 'admin';
    }>().toExtend<Result>();
  });

  it('resolves params from mixed simple and ICU placeholders', () => {
    type Result =
      ExtractTParams<'Hi {name}, you have {count, plural, one {# msg} other {# msgs}}'>;
    expectTypeOf<{
      name: 'A';
      count: 3;
    }>().toExtend<Result>();
  });

  it('resolves params for two ICU arguments in one source', () => {
    type Result =
      ExtractTParams<'You have {count, plural, one {# msg} other {# msgs}} in {folder, select, inbox {Inbox} other {Folder}}'>;
    expectTypeOf<{
      count: 3;
      folder: 'inbox';
    }>().toExtend<Result>();
    expectTypeOf<{
      count: 3;
      folder: 'custom';
    }>().toExtend<Result>();
  });

  it('extracts nested placeholders from plural branches', () => {
    type Result =
      ExtractTParams<'You have {count, plural, one {# by {author}} other {# by {author}}}'>;
    expectTypeOf<{
      count: 1;
      author: 'Alex';
    }>().toExtend<Result>();
    expectTypeOf<{
      count: 1;
    }>().not.toExtend<Result>();
  });

  it('extracts nested placeholders from select branches', () => {
    type Result =
      ExtractTParams<'{theme, select, dark {Hello {name}} other {Bye {name}}}'>;
    expectTypeOf<{
      theme: 'dark';
      name: 'Alex';
    }>().toExtend<Result>();
    expectTypeOf<{
      theme: 'dark';
    }>().not.toExtend<Result>();
  });

  it('extracts nested placeholders from selectordinal branches', () => {
    type Result =
      ExtractTParams<'{place, selectordinal, one {#st: {prize}} other {#th: {prize}}}'>;
    expectTypeOf<{
      place: 1;
      prize: 'Gold';
    }>().toExtend<Result>();
    expectTypeOf<{
      place: 1;
    }>().not.toExtend<Result>();
  });

  it('preserves param types when ICU branches contain literal text', () => {
    type Result = ExtractTParams<'{n, selectordinal, one {1st} other {nth}}'>;
    expectTypeOf<{
      n: 1;
    }>().toExtend<Result>();
  });

  it('resolves a permissive type for an unknown ICU format', () => {
    type Result = ExtractTParams<'{x, mystery, body}'>;
    expectTypeOf<{
      x: 'string-or-num';
    }>().toExtend<Result>();
    expectTypeOf<{
      x: 42;
    }>().toExtend<Result>();
    expectTypeOf<{
      x: Date;
    }>().toExtend<Result>();
  });

  it('returns `never` for a placeholder that starts with a digit', () => {
    expectTypeOf<ExtractTParams<'Item {0}'>>().toEqualTypeOf<never>();
  });

  it('returns `never` for a placeholder with non-identifier characters', () => {
    expectTypeOf<ExtractTParams<'Hi {user.name}'>>().toEqualTypeOf<never>();
  });
});
