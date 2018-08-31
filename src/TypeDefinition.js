export default class TypeDefinition {

  /**
   * @param {string} def - type definition
   */
  constructor(def) {
    this.def = def;
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
   * }
   * `
   * 
   * @returns {[string: Object]} - definition meta data, see above example
   */
  getMetaData() {
    return {
      typeName: this.getTypeName(),
      className: this.getClassName(),
      properties: this.getProperties(),
      inheritances: this.getInheritances(),
      implementations: this.getImplementations(),
    };
  }

  /**
   * Extracts type name from definition
   * 
   * @returns {string} - `type` or `input` or `interface`
   */
  getTypeName() {
    const isType = this.def.startsWith('type');
    const isInput = this.def.startsWith('input');
    const isInterface = this.def.startsWith('interface');
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
   * @returns {string} class name
   */
  getClassName() {
    const regex = /(input|type|interface)\s+[a-zA-Z_]+\s+/g;
    const match = this.def.match(regex);  
    return match[0].replace(/(input|type|interface)/, '').trim();
  }

  /**
   * Extracts inheritance data
   * 
   * the following type def will return [ 'ContentItem', 'HeadlineItem' ]
   * type Content inherits ContentItem, HeadlineItem implements Item { ... }
   * 
   * @returns {[string]} - list of inherited classes
   */
  getInheritances() {
    const regex = /extends\s+[a-zA-Z_\s,]+\s+/ig;
    const match = this.def.match(regex);  
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
   * @returns {[string]} - list of implemented classes
   */
  getImplementations() {
    const regex = /implements\s+[a-zA-Z_\s,]+\s+/ig;
    const match = this.def.match(regex);  
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
   * `
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
   * `
   * 
   * @returns {[string: string]} - list of properties
   * 
   */
  getProperties() {  
    const properties = [];
    //match property definitions
    const propertiesRegex = /\{([^}]+)\}/g;
    const propertiesMatch = this.def.match(propertiesRegex);
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
}