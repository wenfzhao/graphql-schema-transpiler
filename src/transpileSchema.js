/**
 * Extracts type name from definition
 * 
 * @param {string} def - type definition
 * @returns {string} - "type" or "input" or "interface"
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

/**
 * Extracts type class name
 * 
 * @param {string} def - type definition
 */
const getClassName = def => {
  const regex = /(input|type|interface)\s+[a-zA-Z_]+\s+/g;
  const match = def.match(regex);  
  return match[0].replace(/(input|type|interface)/, '').trim();
}

/**
 * Extracts inheritance data
 * 
 * the following type def will return [ 'ContentItem', 'HeadlineItem' ]
 * type Content inherits ContentItem, HeadlineItem implements Item { ... }
 * 
 * @param {string} def - type definition
 * @returns {[string]} - list of inherited classes
 */
const getInheritances = def => {
  const regex = /extends\s+[a-zA-Z_\s,]+\s+/ig;
  const match = def.match(regex);  
  if (!match) {
    return null;
  }
  let inherits = match[0].replace('extends', '').trim();
  const implementsIndex = inherits.lastIndexOf('implements');
  if (implementsIndex !== -1) {
    inherits = inherits.slice(0, implementsIndex);
  }
  const inheritances = inherits.replace(/\s+/g, '').split(',');
  return inheritances;
}

/**
 * Extracts implementation data
 * 
 * the following type def will return [ 'Item' ]
 * type Content inherits ContentItem, HeadlineItem implements Item { ... }
 * 
 * @param {string} def - type definition
 * @returns {[string]} - list of implemented classes
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
 * Extracts property data from type|input definition
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
 * @param {string} def - type definition
 * @returns {[string: string]} - list of properties
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
 * Extracts meta data from type|input definition
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
 *  'inheritances': ['Page', 'Item'],
 *  'definition': 'type Book extends Page, Item { ... }'
 * }
 * 
 * @param {string} def - type definition
 * @returns {[string: string]} - definition meta data, see above example
 */
const getDefinitionMetaData = def => {  
  return {
    typeName: getTypeName(def),
    className: getClassName(def),
    properties: getProperties(def),
    inheritances: getInheritances(def),
    implementations: getImplementations(def),
    definition: def
  };
}

/**
 * Gets list of schema definitions
 * 
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
 * 
 * @param {string} schema - schema string
 * @returns {Object} - definition meta data, see above example, @see @function getDefinitionMetaData
 */
const getSchemaDefinitions = schema => {
  const definitions = {};

  //regex to match all definitions
  const regex = /(input|type|interface)\s+[a-zA-Z_]+\s+(extends\s+[a-zA-Z_\s,]+\s+)?(implements\s+[a-zA-Z_\s,]+\s+)?{([^}]+)}/ig;
  const defs = schema.match(regex);
  for (let def of defs) {
    const metaData = getDefinitionMetaData(def);    
    definitions[metaData.className] = metaData;    
  }
  return definitions
}

/**
 * Merges all properties
 * 
 * @param {Object} properties1 
 * @param {Object} properties2 
 * @returns {Object} - combined properties
 */
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
 * Generates graphql standard type definition
 * 
 * @param {Object} defMetaData - definition meta data, @see @function getDefinitionMetaData
 * @returns {string} - graphql type definition
 */
const generateDef = (defMetaData) => {
  const {
    typeName,
    className,
    properties,
    implementations,
  } = defMetaData;

  let transpiledDef = typeName + ' ' + className + ' ';
  if (implementations) {
    transpiledDef += 'implements ' + implementations.join(', ') + ' ';
  }
  transpiledDef += '{\n';
  for (let property of properties) {
    transpiledDef += '     ' + property.name + ': ' + property.type + '\n';
  }
  transpiledDef += '}\n';
  return transpiledDef;
}

/**
 * Transpiles a single type|input|interface definition
 * 
 * @param {string} defClassName - name of type def to transpile
 * @param {Object} schemaDefinitions -  meta data of all type definitions
 * @returns {Object} - meta data of transpiled type def, @see @function getDefinitionMetaData
 */
const transpileDef = (defClassName, schemaDefinitions) => {
  const defMeta = schemaDefinitions[defClassName];  
  const {
    className,
    inheritances,
    implementations,
    transpiledDef,
    isTranspiling,
  } = defMeta;
  let properties = defMeta.properties;

  //already transpiled
  if (transpiledDef) {
    return defMeta;
  }

  //transpiling means a circular reference is found
  if (isTranspiling) {
    throw new Error('Circular reference found while transpiling "' + className + '"');
  }

  //if definition either extends or implements, it needs transpiling
  if (inheritances || implementations) {
    defMeta.isTranspiling = true;
    schemaDefinitions[className] = defMeta;

    if (inheritances) {
      for (let inheritedClass of inheritances) {
        const inheritanceMeta = transpileDef(inheritedClass, schemaDefinitions);
        properties = mergeProperties(properties, inheritanceMeta.properties); 
      }
    }

    if (implementations) {
      for (let implementedClass of implementations.reverse()) {
        const implementationMeta = transpileDef(implementedClass, schemaDefinitions);
        properties = mergeProperties(properties, implementationMeta.properties); 
      }
    }

    defMeta.properties = properties;
    defMeta.transpiledDef = generateDef(defMeta);
    //flipping the flag off after transpilation is completed
    defMeta.isTranspiling = false;
  }

  return defMeta;
}

/**
 * Transpiles schema to support type|input|interface inheritance
 * 
 * @argument String schema - graphql schema string
 * @returns String transpiled schema string
 */
const transpileSchema = schema => {
  let transpiledSchema = schema;
  const definitions = getSchemaDefinitions(schema);

  for (let className in definitions) {    
    const defMeta = transpileDef(className, definitions);
    //if a transpiled version exist, replace the original def
    if (defMeta.transpiledDef) {      
      transpiledSchema = transpiledSchema.replace(defMeta.definition, defMeta.transpiledDef);
    }
  }
  return transpiledSchema;
}

export default transpileSchema;
exports.transpileSchema = transpileSchema;