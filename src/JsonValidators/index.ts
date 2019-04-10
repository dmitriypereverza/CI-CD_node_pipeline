import Ajv from "ajv";

const ajv = new Ajv();

interface ValidationResponse {
  isValid: boolean;
  errors: any[]
}

export function validate (data, validationSchema): ValidationResponse {
  const validate = ajv.compile(validationSchema);
  const valid = validate(data);

  return {
    isValid: !!valid,
    errors: validate.errors
      ? validate.errors
      : []
  };
}
