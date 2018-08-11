# graphql-type-inheritance
Transpile Your Graphql Schema To Support Type Inheritance
This is a transpiler to allow graphql schema to have inheritance between type, input and interface
Single and multiple inheritance are supported amount type, input and interface


# Why this project is created
GraphQL natively doesn't support type inheritance. Therefore when writing schema, there tends to be a lot of repeated code. The purpose of this project is to introduce type inheritance to reduce/elimate repeated code and make writing schema much easier and cleaner. This allows single/multiple inheritance between `type`, `input`, and `interface`


# How To Use It
```js
const { transpileSchema } = require('graphql-type-inheritance');
//or
// import { transpileSchema } from 'graphql-type-inheritance';

const schema = `

interface Personal {
    firstName: String!
    middleName: String
    lastName: String!
}

interface Professional inherits Personal {
    company: String
    jobTitle: String
}

type Contact implements Professional {
    contactId: ID!
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
}

type EmailContact inherits Contact {
    emailAddress: String!
}

type PhoneContact inherits Contact {
    phone: String!
}

type AddressBook inherits EmailContact, PhoneContact {
    
}

//provide default to override inheritted field
input AddressBookInput inherits AddressBook {
    contactId: ID
}

`

//transpile schema string
const transpiledSchema = transpileSchema(schema);

//will transpile into
const transpiledSchema = `

interface Personal {
    firstName: String!
    middleName: String
    lastName: String!
}

interface Professional {    
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String  
}

type Contact implements Professional {
    contactId: ID!
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
}

type EmailContact {
    contactId: ID!
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
    emailAddress: String!
}

type PhoneContact {
    contactId: ID!
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
    phone: String!
}

type AddressBook {
    contactId: ID!
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
    emailAddress: String!
    phone: String!
}

input AddressBookInput {
    contactId: ID
    firstName: String!
    middleName: String
    lastName: String!
    company: String
    jobTitle: String
    emailAddress: String!
    phone: String!
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

type Employee inherits Person {
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

type Person inherits Node, Address {
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

type AddressInput inherits Address {
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

interface DomElement inherits Element {
    path: String!
}

`
```
