import TypeDefinition from '../src/TypeDefinition';

describe('TypeDefinition', () => {

  test('getTypeName', () => {
    const schema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const typeDef = new TypeDefinition(schema); 
    expect(typeDef.getTypeName()).toEqual('type');
  });

  test('getClassName', () => {
    const schema = `
      type Person {
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const typeDef = new TypeDefinition(schema); 
    expect(typeDef.getClassName()).toEqual('Person');
  });

  test('getImplementations', () => {
    const schema = `
      type Teacher implements Person, Employee   {
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const typeDef = new TypeDefinition(schema); 
    expect(typeDef.getImplementations()).toEqual(['Person', 'Employee']);
  });

  test('getImplementations', () => {
    const schema = `
      type Teacher extends Person, Employee implements Human   {
        firstName: String!
        middleName: String
        lastName: String!
      }
    `;

    const typeDef = new TypeDefinition(schema); 
    expect(typeDef.getInheritances()).toEqual(['Person', 'Employee']);
  });

  test('getImplementations', () => {
    const schema = `
      type Teacher extends Person, Employee implements Human   {
        firstName: String!
        middleName: String
        lastName: String!
        teacherId: Int!
      }
    `;

    const properties = [
      {
        'name': 'firstName',
        'type': 'String!'
      },
      {
        'name': 'middleName',
        'type': 'String'
      },
      {
        'name': 'lastName',
        'type': 'String!'
      },
      {
        'name': 'teacherId',
        'type': 'Int!'
      }
    ];
    const typeDef = new TypeDefinition(schema); 
    expect(typeDef.getProperties()).toEqual(properties);
  });

  test('getImplementations', () => {
    const schema = `
      input TeacherInput extends EmployeeInput, PersonInput   {
        firstName: String!
        middleName: String
        lastName: String!
        teacherId: Int!
      }
    `;

    const properties = [
      {
        'name': 'firstName',
        'type': 'String!'
      },
      {
        'name': 'middleName',
        'type': 'String'
      },
      {
        'name': 'lastName',
        'type': 'String!'
      },
      {
        'name': 'teacherId',
        'type': 'Int!'
      }
    ];
    const typeDef = new TypeDefinition(schema); 
    const metaData = typeDef.getMetaData();
    expect(metaData['typeName']).toEqual('input');
    expect(metaData['className']).toEqual('TeacherInput');
    expect(metaData['inheritances']).toEqual(['EmployeeInput', 'PersonInput']);
    expect(metaData['implementations']).toEqual(null);
    expect(metaData['properties']).toEqual(properties);
  });

});