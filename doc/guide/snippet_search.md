# Snippet Search

<div style="font-size: large; color: red">TODO: Examples, rationale, details...</div>

## Quick overview

The `CodeWords.Search.SearchParser` is an interface for parsing parts of
the search text, with the ability to resume parsing as characters are
added to the search text.

Each call to `SearchParser.attemptParse(..)` returns an array of
`PendingParse` objects. These identify the span of the text that was
parsed, whether they are able to continue parsing, and functions to
transform the parse into an Expression or a Snippet.

<!-- TODO: Implement the following and verify this documentation. -->

There are three primary types of search parsers:
 * For each ValueType, a parser that converts user input into a new
   instance or literal value.
 * A `ScopedSearchParser` that matches the user input to variables and
   constants available in the visible sections of the document.
 * A `TrieParser` to parse less structured forms, like natural language.

### Scopes and the ScopedSearchParser

The `ScopedSearchParser` is specific to the JavaScript CodeLanguage
implementation, but most languages will likely need an equivalent.
It allows the system to recognize well formatted code (and approximately
well formatted code) and offer completions.

Each `AstDocument` and `Block` expression is paired with a `JsScope`
that contains the variables in that scope. Scopes are parented, and
if a match is not found its parent is also searched.

### TrieParser

The `TrieParser` matches sequences of strings and value types into a
loose grammar using a [trie](https://en.wikipedia.org/wiki/Trie) data
structure. Trie nodes can be either strings or value types, and may also
be optional. For each value type node, the trie refers to the matching
value type `SearchParser` and available variables and identifiers.

The `TrieParser` is populated by a number of examples:

    const setBallPositionProcessor = /* TODO: SearchTriePathProcessor */
    trieParser.add(setBallPositionMatcher,
      [ 'move',
        valueType('ball', BALL),
        optional('to'),
        optional('x'),
        valueType('x', NUMBER),
        optional('y'),
        valueType('y', NUMBER)
      ]);

Each matched value type expression, identified by an id string, is
passed to the `SearchTriePathProcessor` to convert it into a `Snippet`.

A `SearchTriePathProcessor` can be reused for multiple trie paths, as
long as the value type ids are consistent:

    trieParser.add(setBallPositionMatcher,
      [ valueType('ball', BALL),
        optional('.'),
        optional('set'),
        'position',
        optional('(')
        valueType('x', NUMBER),
        optional(',')
        valueType('y', NUMBER),
        optional(')')
      ]);
