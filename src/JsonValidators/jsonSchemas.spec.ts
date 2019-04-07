import assert from "assert";
import { validate } from "./index";

describe('Json validation', function() {
  describe('Check on project.conf.json', function() {
    it('validation should return TRUE when config is valid', function() {
      const validateRes = validate(require('../../project.conf.json'), require("../jsonSchemas/client_config.json"));
      assert.strictEqual(validateRes.isValid, true);
    });
  });
});
