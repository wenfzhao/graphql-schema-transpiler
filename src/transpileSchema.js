/**
 * Extract type name from definition
 * 
 * @Return type|input
 */
const getTypeName = def => {
  const isType = def.startsWith('type');
  const isInput = def.startsWith('input');
  const isInterface = def.startsWith('interface');
  let typeName = '';
  if (isType) {
    typeName = 'type';
  }
  if (isInput) {
    typeName = 'input';
  }
  if (isInterface) {
    typeName = 'interface';
  }
  return typeName;
}

const getClassName = def => {
  const regex = /(input|type|interface)\s+[a-zA-Z_]+\s+/g;
  const match = def.match(regex);  
  return match[0].replace(/(input|type|interface)/, '').trim();
}

/**
 * Extract inheritance data
 * 
 * the following type def will return [ 'ContentItem', 'HeadlineItem' ]
 * type Content inherits ContentItem, HeadlineItem implements Item { ... }
 */
const getInheritances = def => {
  const regex = /inherits\s+[a-zA-Z_\s,]+\s+/ig;
  const match = def.match(regex);  
  if (!match) {
    return null;
  }
  let inherits = match[0].replace('inherits', '').trim();
  const implementsIndex = inherits.lastIndexOf('implements');
  if (implementsIndex !== -1) {
    inherits = inherits.slice(0, implementsIndex);
  }
  const inheritances = inherits.replace(/\s+/g, '').split(',');
  return inheritances;
}

/**
 * Extract implementation data
 * 
 * the following type def will return [ 'Item' ]
 * type Content inherits ContentItem, HeadlineItem implements Item { ... }
 */
const getImplementations = def => {
  const regex = /implements\s+[a-zA-Z_\s,]+\s+/ig;
  const match = def.match(regex);  
  if (!match) {
    return null;
  }
  const implenetsDef = match[0].replace('implements', '').trim();
  const implementations = implenetsDef.replace(/\s+/g, '').split(',');
  return implementations;
}

/**
 * Extract property data from type|input definition
 * 
 * [
 *   {
 *     'name': 'id',
 *     'type': 'Int!'
 *   },
 *   {
 *     'name': 'title',
 *     'type': 'String'
 *   }, 
 *   ...
 * ]
 * 
 */
const getProperties = def => {  
  const properties = [];
  //match property definitions
  const propertiesRegex = /\{([^}]+)\}/g;
  const propertiesMatch = def.match(propertiesRegex);
  const propertiesDef = propertiesMatch[0].slice(1, -1);
  const propertiesDefList = propertiesDef.split('\n');

  for (let propertyDef of propertiesDefList) {
    propertyDef = propertyDef.trim();
    if (propertyDef) {
      const lastIndex = propertyDef.lastIndexOf(':');        
      const name = propertyDef.slice(0, lastIndex).trim();
      const type = propertyDef.slice(lastIndex + 1).trim().replace(',', '');
      const property = {
        name,
        type,
      }
      properties.push(property);
    }
  }
  return properties;
}

/**
 * Extract meta data from type|input definition
 * 
 * {
 *  'typeName': 'type',
 *  'className': 'Book',
 *  'properties': [
 *    {
 *      'name': 'id',
 *      'type': 'Int!'
 *    },
 *    {
 *      'name': 'title',
 *      'type': 'String'
 *    }, 
 *    ...
 *  ],
 *  'definition': 'type Book { ... }'
 * }
 * 
 */
const getDefinitionMetaData = def => {
  return {
    typeName: getTypeName(def),
    className: getClassName(def),
    properties: getProperties(def),
    definition: def
  };
}

/**
 * get list of schema definitions
 * {
 *  'Book': {
 *    'typeName': 'type',
 *    'className': 'Book',
 *    'properties': [
 *      {
 *        'name': 'id',
 *        'type': 'Int!'
 *      },
 *      {
 *        'name': 'title',
 *        'type': 'String'
 *      }, 
 *      ...
 *    ],
 *    'definition': 'type Book { ... }'
 *  },
 *  'BookInput': {
 *    'typeName': 'input',
 *    'className': 'BookInput',
 *    ...
 *  },
 *  ...
 * }  
 */
const getSchemaDefinitions = schema => {
  const definitions = {};
  //use regex to extract definitions
  const typeAndInputRegex = /(input|type|interface)\s+[a-zA-Z_]+\s+{([^}]+)}/ig;
  const typesAndInputs = schema.match(typeAndInputRegex);
  for (let def of typesAndInputs) {
    const metaData = getDefinitionMetaData(def);    
    definitions[metaData.className] = metaData;    
  }
  return definitions;
}

const mergeProperties = (properties1, properties2) => {
  const hasProperty = (name, properties) => {
    let hasProperty = false;
    for (let property of properties) {
      if (name == property.name) {
        hasProperty = true;
        break;
      }
    }
    return hasProperty;
  }

  for (let property2 of properties2) {
    //both has same property, don't replace
    if (!hasProperty(property2.name, properties1)) {
      properties1.push(property2);
    }    
  }
  return properties1;
}

/**
 * Transpile a single type|input definition
 */
const transpileDef = (def, schemaDefinitions) => {
  const typeName = getTypeName(def);
  const className = getClassName(def);
  const inheritances = getInheritances(def);
  const implementations = getImplementations(def);
  let properties = getProperties(def);
  if (inheritances) {
    for (let inheritClass of inheritances.reverse()) {
      const definition = schemaDefinitions[inheritClass];
      properties = mergeProperties(properties, definition.properties);      
    }
  }

  let transpiledDef = typeName + ' ' + className + ' ';
  if (implementations) {
    transpiledDef += 'implements ' + implementations.join(', ') + ' ';
  }
  transpiledDef += '{\n';
  for (let property of properties) {
    transpiledDef += '     ' + property.name + ': ' + property.type + '\n';
  }
  transpiledDef += '}\n';
  // console.log(def, '\n', transpiledDef);
  return transpiledDef;
}

/**
 * Transpile schema to support type|input inheritance
 */
const transpileSchema = schema => {
  let transpiledSchema = schema;
  const definitions = getSchemaDefinitions(schema);
  //match all definitions using "inherits" keyword
  const inheritanceRegex = /(input|type|interface)\s+[a-zA-Z_]+\s+inherits\s+[a-zA-Z_\s,]+\s+{([^}]+)}/ig;
  const defsWithInheritance = schema.match(inheritanceRegex);
  if (defsWithInheritance) {
    //transpile the definitions and replace them in the schema
    for (let inheritanceDef of defsWithInheritance) {
      const transpiledDef = transpileDef(inheritanceDef, definitions);
      transpiledSchema = transpiledSchema.replace(inheritanceDef, transpiledDef);    
    }
  }
  return transpiledSchema;
}

export default transpileSchema;
