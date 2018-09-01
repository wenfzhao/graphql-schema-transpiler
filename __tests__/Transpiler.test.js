import Transpiler from '../src/Transpiler';

const compressString = function(string) { 
  return string.replace(/[\n\r]+/g, '').replace(/[\t\r]+/g, '').replace(/ /g,'') 
};

describe('GraphQL Schema Transpiler', () => {

  test('test type inheritance', () => {
    const schema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }

      type Student extends Person {
        studentId: Int!
      }
    `;

    const transpiledSchema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }

      type Student {
        studentId: Int!
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const transpiler = new Transpiler(); 
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });

  test('input inheritance', () => {
    const schema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }

      type Student extends Person {
        studentId: Int!
      }

      input StudentInput extends Student {
        studentId: Int
      }
    `;

    const transpiledSchema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }

      type Student {
        studentId: Int!
        firstName: String!
        middleName: String
        lastName: String!
      }

      input StudentInput {
        studentId: Int
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const transpiler = new Transpiler(); 
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });

  test('interface inheritance', () => {
    const schema = `
      interface Node {
        id: Int
      }

      interface NodeA extends Node {
        name: String
      }

      interface NodeB extends Node {
        count: Int
      }

      type Product implements NodeA {
        price: Float
      }
    `;

    const transpiledSchema = `      
      interface Node {
        id: Int
      }

      interface NodeA {
        name: String
        id: Int
      }

      interface NodeB {
        count: Int
        id: Int
      }

      type Product implements NodeA {
        price: Float
        name: String
        id: Int
      }
    `;

    const transpiler = new Transpiler(); 
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });



  test('nested type inheritance and missing type', () => {
    const schema = `
      type Address {
        street: String!
        Apt: String
        State: String
        Country: String!
      }

      type Person {
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      type Student extends Person {
        studentId: Int!
      }

      input StudentInput extends Student {
        studentId: Int
      }
    `;

    const transpiledSchema = `
      type Address {
        street: String!
        Apt: String
        State: String
        Country: String!
      }

      type Person {
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      type Student {
        studentId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      input StudentInput {
        studentId: Int
        firstName: String!
        middleName: String
        lastName: String!
        address: AddressInput!
      }

      input AddressInput {
        street: String!
        Apt: String
        State: String
        Country: String!
      }
    `;

    
    const transpiler = new Transpiler({
      addMissingTypesAndInputs: true,
    }); 
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });

  test('all', () => {
    const schema = `
      type Address {
        street: String!
        Apt: String
        State: String
        Country: String!
      }

      type School {
        name: String!
        address: Address!
      }

      type Person {
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      type Student extends Person {
        studentId: Int!
      }

      type Teach extends Person {
        school: School
      }

      extend type Teach {
        teachId: Int!
        facultyId: Int!
      }

      input TeachInput extends Teach {
      }
    `;

    const transpiledSchema = `
      type Address {
        street: String!
        Apt: String
        State: String
        Country: String!
      }

      type School {
        name: String!
        address: Address!
      }

      type Person {
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      type Student {
        studentId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }

      type Teach {
        school: School
        teachId: Int!
        facultyId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: Address!
      }
    
      extend type Teach {
        teachId: Int!
        facultyId: Int!
      }

      input TeachInput {
        school: SchoolInput
        teachId: Int!
        facultyId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: AddressInput!
      }

      input SchoolInput {
        name: String!
        address: AddressInput!
      }

      input AddressInput {
        street: String!
        Apt: String
        State: String
        Country: String!
      }
    `;
    
    const transpiler = new Transpiler({
      addMissingTypesAndInputs: true,
    });     
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });
});