// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

describe('CodeWords.Util.computeSplice(arrayA, arrayB)', function() {
  const computeSplice = CodeWords.Util.computeDiffSplice;

  it('returns null when the arrays are the same', () => {
    expect(computeSplice([], [])).toBeNull();
    expect(computeSplice([1], [1])).toBeNull();
    expect(computeSplice([1, 2], [1, 2])).toBeNull();
    expect(computeSplice([1, 2, 3], [1, 2, 3])).toBeNull();

    expect(computeSplice(['a', 'b', 'c'], ['a', 'b', 'c'])).toBeNull();

    const objA = {}, objB = {}, objC = {};
    expect(computeSplice([objA, objB, objC], [objA, objB, objC])).toBeNull();
  });

  it('can detect deletions at the beginning', () => {
    expect(computeSplice([1], [])).
        toEqual({position: 0, deleteCount: 1, insertCount: 0});
    expect(computeSplice([1, 2], [])).
        toEqual({position: 0, deleteCount: 2, insertCount: 0});
    expect(computeSplice([1, 2, 3], [])).
        toEqual({position: 0, deleteCount: 3, insertCount: 0});

    expect(computeSplice(['old', 1, 2, 3], [1, 2, 3])).
        toEqual({position: 0, deleteCount: 1, insertCount: 0});
  });

  it('can detect deletions in the middle', () => {
    expect(computeSplice([1, 'old', 2], [1, 2])).
        toEqual({position: 1, deleteCount: 1, insertCount: 0});
    expect(computeSplice([1, 'delete', 'two', 2], [1, 2])).
        toEqual({position: 1, deleteCount: 2, insertCount: 0});
    expect(computeSplice([1, 'delete', 'three', 'more', 2], [1, 2])).
        toEqual({position: 1, deleteCount: 3, insertCount: 0});

    expect(computeSplice([1, 2, 'old', 3, 4], [1, 2, 3, 4])).
        toEqual({position: 2, deleteCount: 1, insertCount: 0});
  });

  it('can detect deletions at the end', () => {
    expect(computeSplice(['old'], [])).
        toEqual({position: 0, deleteCount: 1, insertCount: 0});
    expect(computeSplice([1, 'old'], [1])).
        toEqual({position: 1, deleteCount: 1, insertCount: 0});
    expect(computeSplice([1, 2, 'delete', 'two'], [1, 2])).
        toEqual({position: 2, deleteCount: 2, insertCount: 0});

    expect(computeSplice([1, 2, 3, 'old'], [1, 2, 3])).
        toEqual({position: 3, deleteCount: 1, insertCount: 0});
  });

  it('can detect insertions at the beginning', () => {
    expect(computeSplice([], [1])).
        toEqual({position: 0, deleteCount: 0, insertCount: 1});
    expect(computeSplice([], [1, 2])).
        toEqual({position: 0, deleteCount: 0, insertCount: 2});
    expect(computeSplice([], [1, 2, 3])).
        toEqual({position: 0, deleteCount: 0, insertCount: 3});

    expect(computeSplice([1, 2, 3], ['new', 1, 2, 3])).
        toEqual({position: 0, deleteCount: 0, insertCount: 1});
  });

  it('can detect insertions in the middle', () => {
    expect(computeSplice([1, 2], [1, 'new', 2])).
        toEqual({position: 1, deleteCount: 0, insertCount: 1});
    expect(computeSplice([1, 2], [1, 'add', 'two', 2])).
        toEqual({position: 1, deleteCount: 0, insertCount: 2});
    expect(computeSplice([1, 2], [1, 'add', 'three', 'more', 2])).
        toEqual({position: 1, deleteCount: 0, insertCount: 3});

    expect(computeSplice([1, 2, 3, 4], [1, 2, 'new', 3, 4])).
        toEqual({position: 2, deleteCount: 0, insertCount: 1});
  });

  it('can detect insertions at the end', () => {
    expect(computeSplice([], ['new'])).
        toEqual({position: 0, deleteCount: 0, insertCount: 1});
    expect(computeSplice([1], [1, 'new'])).
        toEqual({position: 1, deleteCount: 0, insertCount: 1});
    expect(computeSplice([1, 2], [1, 2, 'add', 'two'])).
        toEqual({position: 2, deleteCount: 0, insertCount: 2});

    expect(computeSplice([1, 2, 3], [1, 2, 3, 'new'])).
    toEqual({position: 3, deleteCount: 0, insertCount: 1});
  });

  it('can detect replacement at the beginning', () => {
    expect(computeSplice(['replace me'], ['with this'])).
        toEqual({position: 0, deleteCount: 1, insertCount: 1});
    expect(computeSplice(['replace', 'me'], ['with', 'this'])).
        toEqual({position: 0, deleteCount: 2, insertCount: 2});
    expect(computeSplice([1, 2, 3], ['one', 2, 3])).
        toEqual({position: 0, deleteCount: 1, insertCount: 1});
    expect(computeSplice([1, 2, 3], ['uno', 'dos', 3])).
        toEqual({position: 0, deleteCount: 2, insertCount: 2});

    expect(computeSplice([1, 2, 3, 4], ['1 2 3', 4])).
        toEqual({position: 0, deleteCount: 3, insertCount: 1});
    expect(computeSplice(['1 2 3', 4], [1, 2, 3, 4])).
        toEqual({position: 0, deleteCount: 1, insertCount: 3});
  });

  it('can detect replacement at the end', () => {
    expect(computeSplice([1, 2, 'replace me', 3, 4], [1, 2, 'with this', 3, 4])).
        toEqual({position: 2, deleteCount: 1, insertCount: 1});
    expect(computeSplice([1, 2, 'replace', 'me', 3, 4], [1, 2, 'with', 'this', 3, 4])).
        toEqual({position: 2, deleteCount: 2, insertCount: 2});
    expect(computeSplice([1, 2, 'replace me', 3, 4], [1, 2, 'with', 'this', 3, 4])).
        toEqual({position: 2, deleteCount: 1, insertCount: 2});
    expect(computeSplice([1, 2, 'replace', 'me', 3, 4], [1, 2, 'with this', 3, 4])).
        toEqual({position: 2, deleteCount: 2, insertCount: 1});
  });


  it('can detect replacement at the end', () => {
    expect(computeSplice([1, 2, 'replace me'], [1, 2, 'with this'])).
    toEqual({position: 2, deleteCount: 1, insertCount: 1});
    expect(computeSplice([1, 2, 'replace', 'me'], [1, 2, 'with', 'this'])).
    toEqual({position: 2, deleteCount: 2, insertCount: 2});
    expect(computeSplice([1, 2, 'replace me'], [1, 2, 'with', 'this'])).
    toEqual({position: 2, deleteCount: 1, insertCount: 2});
    expect(computeSplice([1, 2, 'replace', 'me'], [1, 2, 'with this'])).
    toEqual({position: 2, deleteCount: 2, insertCount: 1});
  });
});
