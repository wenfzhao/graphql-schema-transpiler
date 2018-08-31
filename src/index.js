import Transpiler from './Transpiler';

/**
 * Transpiles schema to support type|input|interface inheritance
 * use addMissingTypeOrInput flag to enable easy inheritance between type and input
 * 
 * i.e. An `input` type can not have a property with type `type`, this is not allowed in standard graphql, 
 * therefore we need an input type for that property as well, `addMissingTypeOrInput` flag will try to create a new `input` 
 * type based on the current property `type` defined
 * 
 * @param {string} schema - graphql schema string
 * @param {boolean} addMissingTypeOrInput - Add missing type or input definition if the property has an incompatible type. 
 * @returns {string} transpiled schema string
 */
const transpileSchema = (schema, options = {}) => {
  const transpiler = new Transpiler(options);
  return transpiler.transpile(schema);
}

export default transpileSchema;