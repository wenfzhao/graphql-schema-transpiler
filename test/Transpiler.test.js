import Transpiler from '../src/Transpiler';
import TypeDefinition from '../src/TypeDefinition';

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

  test('transpile', () => {
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

  test('generateDef', () => {
    const schema = `
      input TeachInput extends PersonInput implements HumanInput {
        school: SchoolInput
        teachId: Int!
        facultyId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: AddressInput!
      } 
    `;
    const transpiledDef = `
      input TeachInput implements HumanInput {
        school: SchoolInput
        teachId: Int!
        facultyId: Int!
        firstName: String!
        middleName: String
        lastName: String!
        address: AddressInput!
      }
    `;

    const transpiler = new Transpiler({
      addMissingTypesAndInputs: true,
    });     
    const typeDef = new TypeDefinition(schema);
    expect(compressString(transpiler.generateDef(typeDef.getMetaData()))).toEqual(compressString(transpiledDef));
  });

  test('test directive', () => {
    const schema = `
      directive @upper on FIELD_DEFINITION
      directive @date(format: String) on FIELD_DEFINITION

      scalar Date

      type Person {
        firstName: String! @upper
        middleName: String @upper
        lastName: String! @upper
        birthDate: Date @date(format: "mmmm d yyyy")
      }

      type Student extends Person {
        studentId: Int!
      }
    `;

    const transpiledSchema = `
      directive @upper on FIELD_DEFINITION
      directive @date(format: String) on FIELD_DEFINITION

      scalar Date

      type Person {
        firstName: String! @upper
        middleName: String @upper
        lastName: String! @upper
        birthDate: Date @date(format: "mmmm d yyyy")
      }

      type Student {
        studentId: Int!
        firstName: String! @upper
        middleName: String @upper
        lastName: String! @upper
        birthDate: Date @date(format: "mmmm d yyyy")
      }
    `;

    const transpiler = new Transpiler(); 
    expect(compressString(transpiler.transpile(schema))).toEqual(compressString(transpiledSchema));
  });
  
});