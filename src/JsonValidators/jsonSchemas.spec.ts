import assert from "assert";
import { getValidateFunc } from "./index";

describe('Json validation', function() {
  describe('Check on project.conf.json', function() {
    it('validation should return TRUE when config is valid', function() {
      const validate = getValidateFunc(require("../jsonSchemas/client_config.json"));
      const valid = validate(require('../../project.conf.json'));
      assert.strictEqual(valid, true);
    });
  });
});
