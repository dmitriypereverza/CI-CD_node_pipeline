export const buildProjectConfig = (config, params) => {
  let jsonConfig = JSON.stringify(config);

  let matches;
  while ((matches = /#([^"]+?)#/gmu.exec(jsonConfig)) !== null) {
    if (matches[0] && params[matches[1]]) {
      jsonConfig = jsonConfig.replace(matches[0], params[matches[1]]);
    }
  }

  return JSON.parse(jsonConfig);
};
