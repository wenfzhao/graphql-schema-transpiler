# graphql-schema-transpiler
Transpile Your Graphql Schema To Support Type Inheritance
This is a transpiler to allow graphql schema to have inheritance between type, input and interface.
GraphQL natively doesn't support type inheritance. Therefore when writing schema, there tends to be a lot of repeated code. The purpose of this project is to introduce type inheritance to reduce/elimate repeated code and make writing schema much easier and cleaner. This allows single/multiple inheritance between `type`, `input`, and `interface`


## Features
  - Inheritance for `type`, `input`, `interface`
  - When implements `interface`, all fields are copied over
  - Allow inheritance between `type` and `input` to allow code reuse


## Installation
`npm install graphql-schema-transpiler --save`


## API

<!--lint enable code-block-style-->

### `transpileSchema(schema[, options])`
Transpile the schema to stardard GraphQL Schema.

#### `schema` 
`string` - schema string to transpile

#### `option`

##### `options.addMissingTypesAndInputs`
`bool?` - When inheriting between `type` and `input`, fields will be copied with the correct type. 
Fields with output type in parent will be changed to input type when copied to child of `input` type

##### `options.debug`
`bool?` - enable debug log


## How To Use It
```js
const { transpileSchema } = require('graphql-schema-transpiler');
//or
// import { transpileSchema } from 'graphql-schema-transpiler';

const schema = `

interface Searchable {
  searchQuery: String!
}

type Person {
  firstName: String!
  middleName: String
  lastName: String!
}

type Author extends Person implements Searchable {
  email: String
}

type Book implements Searchable {
  id: Int!
  title: String!
  authors: [Author] 
}

# provide default to override inheritted field
input BookInput extends Book {
  id: Int
}

`

//transpile schema string
const transpiledSchema = transpileSchema(schema);

//will transpile into
const transpiledSchema = `

interface Searchable {
  searchQuery: String!
}

type Person {
  firstName: String!
  middleName: String
  lastName: String!
}

type Author implements Searchable {
  email: String
  firstName: String!
  middleName: String
  lastName: String!
  searchQuery: String!
}

type Book implements Searchable {
  id: Int!
  title: String!
  authors: [Author]
  searchQuery: String!
}

# provide default to override inheritted field
input BookInput {
  id: Int
  title: String!
  authors: [AuthorInput]
  searchQuery: String!
}

input AuthorInput implements Searchable {
  email: String
  firstName: String!
  middleName: String
  lastName: String!
  searchQuery: String!
}

`

```


[**Type Inheritance**](#type-inheritance)

## Single Inheritance

```js
const schema = `

type Person {
  firstName: String!
  middleName: String
  lastName: String!
}

type Employee extends Person {
  jobTitle: String!
  company: String!
}
`
```


## Multiple Inheritance

```js
const schema = `

type Node {
  id: ID!
}

type Address {
  streetAddress: String
  city: String
  state: String
}

type Person extends Node, Address {
}

`
```


## Inheritance Between Type And Input

```js
const schema = `

input Address {
  id: Int!
  streetAddress: String
  city: String
  state: String
}

type AddressInput extends Address {
  id: Int
}

`
```


## Interface Inheritance

```js
const schema = `

interface Element {
  id: ID!
}

interface DomElement extends Element {
  path: String!
}

`
```


## Implementation

```js
const schema = `

interface Element {
  id: ID!
}

type DomElement implements Element {
  path: String!
}

`

//will transpile into
const transpiledSchema = `

interface Element {
  id: ID!
  name: String!
}

type DomElement implements Element {
  id: ID!
  name: String!
  path: String!
}

`
```
