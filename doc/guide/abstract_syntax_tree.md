# Abstract Syntax Tree

Code Words operates on the abstract syntax tree (AST) of its documents.
In Code Words, the AST is composed of `CodeWords.AST.Expression`
objects, with a `CodeWords.AST.ASTDocument` as the root element.
Expressions are defined by `CodeWords.AST.ExpressionTypes`. A set of all
possible `ExpressionType`s in a document are collected together to
define a `CodeWords.AST.CodeLanguage`, the language metadata the
`CodeWords.Editor` operates on.

## Expressions

Each Expression object represents one branch or lead node of the
abstract syntax tree.

An expression can have its own expression children, registered into a
"slot". A slot effectively acts as a named look-up of the child,
but slots are also ordered. The ordering of slots should reflect the
render order of the expression children.

Expressions come in three primary varieties, reflecting how they use
slots:

 * `CodeWords.AST.LeafExpression`s do not have children. However, they
   often carry additional data. Most leaf nodes will subclass
   `LeafExpression` to store that data and provide their own factory
   function to the `LeafExpressionType` to instantiate the node.
 * `CodeWords.AST.DynamicSlotsExpression`s have a sequence of children.
   While each child has a slot/path id, the slot names are dynamically
   generated and not semantically important. Instead the order of the
   slots is what matters in the context of the parent. `AstDocument`s
   are top level `DynamicSlotsExpression`s that also have ability divide
   their contents into small renderable chunks.
 * `CodeWords.AST.FixedSlotsExpression`s have a fixed number of named
   slots, and each slot usually has a different implied meaning or role.
   While the slots `FixedSlotsExpression` are ordered for rendering, the
   API focuses on slot name access reflecting its importance.

<!-- TODO: Example expressions -->

Each class of Expression is also paired with a
`CodeWords.AST.ExpressionType` definition class:

 * `CodeWords.AST.LeafExpressionType`
 * `CodeWords.AST.DynamicSlotsExpressionType`
 * `CodeWords.AST.AstDocumentType`
 * `CodeWords.AST.FixedSlotsExpressionType`

Collectively, a set of `ExpressionType`s defines a `CodeLanguage`. Each
expression maintains a reference to the `CodeLanguage`, providing a
convenient hook to create new complimentary `Expression` objects for a
document or code snippet, and providing a quick means of determining
whether two expressions are compatible. (All expressions of a document
must belong to the same language.)

## Slot Paths

Using an array of slot names as path components, an action or method can
reference a specific `Expression` node.

### Example

For example, the following program:

    if (1 === 2) {
      console.log('Uh-oh!');
      throw new Error();
    }

This aligns to the CodeWordsJS syntax tree:

```yaml
ASTDocument
    0_xntr: If
        condition: EqualsOperator  ## i.e., ===
            left: NumberLiteral 1
            right: NumberLiteral 2
        body: Block
            0_rjwi: FunctionCall
                function: MemberOf  ## i.e., dot operator
                    left: Identifier "console"
                    right: Identifier "log"
                params:
                    0_ucny: StringLiteral 'Uh-oh!'
            1_iqyn: throw
                object: NewOperator ## i.e., new class instance
                    constructor: Identifier "Error"
                    params: (empty list)
        elsebody: (null)
```

Notice first, the document children do not map directly to the lines of
the program. The `if` `body` is a block that covers several lines.

Next, notice the 'document', the `if` body block, and the function call
parameters each have number prefixed slot names. These are each
`DynamicalSlotsExpression`s. While such numbers are not normally active,
such numbers can be activated by setting
`CodeWords.FREEZE_OPTIONS.prefixDynamicSlotIndex` to true. This is
useful for understand or debugging an action or function call.

Each `DynamicalSlotsExpression` allows an unlimited number of children.
At the semantic layer, such as a specific named function in a call, the
number and types may be constrained. At the syntax and expression
definition level, there are no constraints.

Through the slot names we can define a path through the document.
The path to the number literal "2" would be:

```js
['0_xntr',     // Expression in the document. Slot prefixed with line index.
 'condition',  // The 'condition' slot of the 'if' statement.
 'right'       // 'right' side of the '===' binary operator.
]
```

Such paths are used to describe potential insertion/replacement
locations, such as the insertion of another numeric expression.
