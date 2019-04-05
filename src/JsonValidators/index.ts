import Ajv, { ValidateFunction } from "ajv";

const ajv = new Ajv();

export function getValidateFunc(schema): ValidateFunction {
  return ajv.compile(schema);
}
