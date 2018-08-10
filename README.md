# graphql-type-inheritance
Transpile Your Graphql Schema To Support Type Inheritance
This is a transpiler to allow graphql schema to have inheritance between type, input and interface
Single and multiple inheritance are supported amount type, input and interface

# How To Use It
```js
const { transpileSchema } = require('graphql-type-inheritance');
//or
// import { transpileSchema } from 'graphql-type-inheritance';
const { makeExecutableSchema } = require('graphql-tools')

const schema = `
type Node {
	id: ID!
}

type Person inherits Node {
	firstname: String
	lastname: String
}

type Student inherits Person {
	nickname: String
}

type Query {
  students: [Student]
}
`

const resolver = {
        Query: {
            students(root, args, context) {
            	// replace this dummy code with your own logic to extract students.
                return [{ id: 1, firstname: "Carry", lastname: "Connor", nickname: "Cannie" }]
            }
        }
    };

const executableSchema = makeExecutableSchema({
  typeDefs: [transpileSchema(schema)],
  resolvers: resolver
})
```

[**Type Inheritance**](#type-inheritance)

## Single Inheritance

```js
const schema = `
type Node {
	id: ID!
}

# Inheriting from the 'Node' type
type Person inherits Node {
	firstname: String
	lastname: String
}

# Inheriting from the 'Person' type
type Student inherits Person {
	nickname: String
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

# Inheriting from the 'Node' & 'Adress' type
type Person inherits Node, Address {
	id: ID!
	streetAddress: String
	city: String
	state: String
	firstname: String
	lastname: String
}

`
```

## Inheritance Between Type And Input

```js
const schema = `

input AddressInput {
  streetAddress: String
	city: String
	state: String
}

type Address inherits AddressInput {
}

# Inheriting from the 'Node' & 'Adress' type
type Person inherits Node, Address {
	id: ID!
	streetAddress: String
	city: String
	state: String
	firstname: String
	lastname: String
}

`
```

## Interface Inheritance

```js
const schema = `

interface Element {
  id: ID!
}

interface DomElement inherits Element {
  path: String!
}

`
```
