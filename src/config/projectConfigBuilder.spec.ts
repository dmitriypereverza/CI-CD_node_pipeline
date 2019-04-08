import assert from "assert";

import { buildProjectConfig } from "./projectConfigBuilder";

describe('Config builder', function() {
  describe('Check build config', function() {
    it('try to set privatePamam in config', function() {

      const params = { prodPass: "test666", userName: "useryyy" };
      const buildedCondig = buildProjectConfig(require('../../project.conf.json'), params);

      assert.strictEqual(buildedCondig.targets[0].deploy.ssh.pass, params.prodPass);
      assert.strictEqual(buildedCondig.targets[0].deploy.ssh.username, params.userName);
    });
  });
});
