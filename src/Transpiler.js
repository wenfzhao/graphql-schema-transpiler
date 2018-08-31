import TypeDefinition from './TypeDefinition';

export default class Transpiler {

  /**
   * 
   * @param {Object} options transpiler options
   * `
   *  {
   *    addMissingTypesAndInputs: false, 
   *    debug: false,
   *  }
   * `
   * - addMissingTypesAndInputs: 
   *    Allows transpiler to auto fix and create new type definition from a related type(ie, Book and BookInput) 
   *    when incompatible types are found inside a Type definition such as having an property with `Input` type 
   *    in a output `Type` definition is a violation of GraphQL schema defintion.
   * - debug:
   *    Enable debug log
   */
  constructor(options) {
    const defaultOptions = {
      addMissingTypesAndInputs: false,
      debug: false,
    };    
    this.options = Object.assign(defaultOptions, options);
    this.log('Tranpiler with options: ');
    this.log(this.options);    
  }

  /**
   * Transpiles schema to support type|input|interface inheritance
   * use addMissingTypesAndInputs flag to enable easy inheritance between type and input
   * 
   * i.e. An `input` type can not have a property with type `type`, this is not allowed in standard graphql, 
   * therefore we need an input type for that property as well, `addMissingTypesAndInputs` flag will try to create a new `input` 
   * type based on the current property `type` defined
   * 
   * @param {string} schema - graphql schema string
   * @returns {string} transpiled schema string
   */
  transpile(schema) {
    this.log('Transpiling schema ... ');
    let transpiledSchema = schema;
    const definitions = this.getSchemaDefinitions(schema);

    for (let className in definitions) {    
      this.transpileDef(className, definitions);
    }

    console.log(definitions['Query']);
    

    //have to use a different loop to add the transpiled defs 
    //since the above transpileDef function might add data to the definitions array 
    for (let className in definitions) {    
      const defMeta = definitions[className];
      if (defMeta.isNew) {
        this.log(`Generating type definition for "${className}"`);
        transpiledSchema += this.generateDef(defMeta);
      } else if (defMeta.transpiledDef) {      
        transpiledSchema = transpiledSchema.replace(defMeta.definition, defMeta.transpiledDef);
      }
    }
    
    return transpiledSchema;
  }

  /**
   * Gets list of schema definitions
   * 
   * `
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
   * `
   * 
   * @param {string} schema - schema string
   * @returns {Object} - definition meta data, see above example, @see @function getDefinitionMetaData
   */
  getSchemaDefinitions(schema) {
    const definitions = {};

    //regex to match all definitions
    const regex = /(input|type|interface)\s+[a-zA-Z_]+\s+(extends\s+[a-zA-Z_\s,]+\s+)?(implements\s+[a-zA-Z_\s,]+\s+)?{([^}]+)}/ig;
    const defs = schema.match(regex);
    for (let def of defs) {
      const metaData = this.getDefinitionMetaData(def);    
      definitions[metaData.className] = metaData;    
    }

    //extend regex to add properties to existing types
    const extendRegex = /extend\s+(input|type|interface)\s+\w+\s+{([^}]+)}/ig;
    const extendDefs = schema.match(extendRegex);
    for (let extendDef of extendDefs) {
      const typeDef = new TypeDefinition(extendDef);
      const className = typeDef.getClassName();
      const defMeta = definitions[className];
      defMeta.properties = this.mergeProperties(defMeta.properties, typeDef.getProperties());
    }
    return definitions;
  }

  /**
   * Transpiles a single type|input|interface definition
   * 
   * @param {string} defClassName - name of type def to transpile
   * @param {Object} schemaDefinitions -  meta data of all type definitions
   * @returns {Object} - meta data of transpiled type def, @see @function getDefinitionMetaData
   */
  transpileDef(defClassName, schemaDefinitions) {
    this.log('Transpiling Type - ' + defClassName);
    //definition meta data
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
          //definition meta data of the inheritted class
          const inheritanceMeta = this.transpileDef(inheritedClass, schemaDefinitions);
          properties = this.mergeProperties(properties, inheritanceMeta.properties); 
        }
      }
  
      if (implementations) {
        for (let implementedClass of implementations.reverse()) {
          const implementationMeta = this.transpileDef(implementedClass, schemaDefinitions);
          properties = this.mergeProperties(properties, implementationMeta.properties); 
        }
      }
  
      defMeta.properties = properties;
      defMeta.transpiledDef = this.generateDef(defMeta);
      //flipping the flag off after transpilation is completed
      defMeta.isTranspiling = false;
    }
  
    //fix incompatible properties
    if (this.options.addMissingTypesAndInputs && this.defHasMissingOrIncompatiblePropertyTypes(defClassName, schemaDefinitions)) {
      this.addMissingTypeOrInputFromProperties(defClassName, schemaDefinitions);
      //generate transpiled definition
      defMeta.transpiledDef = this.generateDef(defMeta);
    }
  
    return defMeta;
  }

  /**
   * Extracts meta data from type|input definition
   * 
   * `
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
   * `
   * 
   * @param {string} def - type definition
   * @returns {[string: Object]} - definition meta data, see above example
   */
  getDefinitionMetaData(def) {  
    const typeDef = new TypeDefinition(def);
    const typeDefMeta = typeDef.getMetaData();
    return {
      ...typeDefMeta,
      definition: def
    };
  }

  /**
   * Merges all properties
   * 
   * @param {Object} properties1 
   * @param {Object} properties2 
   * @returns {Object} - combined properties
   */
  mergeProperties(properties1, properties2) {
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
  generateDef(defMetaData) {
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
   * Adds the missing type definition if the property types are incompatible with the current definition
   * 
   * ie. input type having regular type as one of the property type
   * The following example having Author as a property type of input type - BookInput 
   * `
   *   type Author { ... }
   *   input BookInput {
   *     authors: [Author]
   *   }
   * `
   *  
   * @param {string} defClassName - name of type def
   * @param {Object} schemaDefinitions -  meta data of all type definitions
   * @returns {Void}
   */
  addMissingTypeOrInputFromProperties(defClassName, schemaDefinitions) {
    const defMeta = schemaDefinitions[defClassName];
    const { properties} = defMeta;
    const isInput = defMeta.typeName == 'input';
    for (let property of properties) {
      //remove '[]!' from type name
      const propertyType = property.type.replace(/\[|\]|!/g, '');
      if (this.isGenericType(propertyType)) {
        continue;
      }

      const propertyTypeDef = schemaDefinitions[propertyType];    
      //custom input or type
      if (propertyTypeDef) {
        const incompatibleType = defMeta.typeName != propertyTypeDef.typeName;
        if (incompatibleType) {          
          //for input, new property type name should be appeneded 'Input' otherwise remove 'Input'
          const newPropertyType = isInput ? propertyTypeDef.className + 'Input' : propertyTypeDef.className.replace('Input', '');
          const newClassDef = schemaDefinitions[newPropertyType];
          //there is no valid type definition, create one from the current property type definition
          if (!newClassDef) {
            let def = propertyTypeDef.definition;
            def = def.replace(propertyTypeDef.typeName, defMeta.typeName);
            def = def.replace(propertyTypeDef.className, newPropertyType);
            const newTypeDefMeta = this.getDefinitionMetaData(def);
            newTypeDefMeta.isNew = true;
            newTypeDefMeta.inheritances = newTypeDefMeta.inheritances ? newTypeDefMeta.inheritances.push(propertyTypeDef.className) : [propertyTypeDef.className];
            schemaDefinitions[newTypeDefMeta.className] = newTypeDefMeta;
            //transpile the new definition
            this.transpileDef(newTypeDefMeta.className, schemaDefinitions, true);   
          }      
          property.type = property.type.replace(propertyType, newPropertyType);
          this.log(`"${defClassName}": property "${property.name}" has incompatible type, changing it from "${propertyType}" to "${newPropertyType}".`);
        }
      } else {      
        const relatedType = propertyType.endsWith('Input') ? propertyType.replace('Input', ''): propertyType + 'Input' ;
        const relatedTypeDef = schemaDefinitions[relatedType]; 
        //no related type definition found, skip
        if (!relatedTypeDef) {
          continue;
        }
        
        const compatibleType = defMeta.typeName == relatedTypeDef.typeName;      
        if (compatibleType) {
          property.type = property.type.replace(propertyType, relatedType);
        } else {
          let def = relatedTypeDef.definition;
          def = def.replace(relatedTypeDef.typeName, defMeta.typeName);
          def = def.replace(relatedTypeDef.className, propertyType);
          const newTypeDefMeta = this.getDefinitionMetaData(def);      
          
          newTypeDefMeta.isNew = true;
          newTypeDefMeta.inheritances = newTypeDefMeta.inheritances ? newTypeDefMeta.inheritances.push(relatedTypeDef.className) : [relatedTypeDef.className];
          schemaDefinitions[newTypeDefMeta.className] = newTypeDefMeta;
          //transpile the new definition
          this.transpileDef(newTypeDefMeta.className, schemaDefinitions, true);
        }      
      }
    }
  }

  defHasMissingOrIncompatiblePropertyTypes(defClassName, schemaDefinitions) {
    const defMeta = schemaDefinitions[defClassName];
    let hasIncompatiblePropertyTypes = false;
    for (let property of defMeta.properties) { 
      //remove '[]!' from type name
      const propertyType = property.type.replace(/\[|\]|!/g, '');
      if (this.isGenericType(propertyType)) {
        continue;
      }
      const propertyTypeDef = schemaDefinitions[propertyType];  
      if (!propertyTypeDef || defMeta.typeName != propertyTypeDef.typeName) {
        if (!propertyTypeDef) {
          this.log(`"${defClassName}": type definition for "${propertyType}" is missing for property "${property.name}".`);
        } else {
          this.log(`"${defClassName}": property "${property.name}" has incompatible type - "${propertyType}"`);
        }
        hasIncompatiblePropertyTypes = true;
        break;
      }
    }
    return hasIncompatiblePropertyTypes;
  }

  isGenericType(type) {
    const genericTypes = ['Int', 'String', 'Boolean', 'ID', 'FLOAT'];
    return genericTypes.includes(type);
  }

  log(message) {
    if (this.options.debug) {
      console.log(message);
    }
  }

}