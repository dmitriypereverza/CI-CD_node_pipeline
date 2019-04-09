export const buildProjectConfig = (config, params) => {
  let jsonConfig = JSON.stringify(config);

  let matches;
  while ((matches = /#([^"]+?)#/gmu.exec(jsonConfig)) !== null) {
    if (matches[0]) {
      if (params[matches[1]] === undefined) {
        throw new Error(`Не найден параметр "${matches[1]}" для конфига проекта. Зарегистрируйте этот параметр в сервисе.`);
      }
      jsonConfig = jsonConfig.replace(matches[0], params[matches[1]]);
    }
  }

  return JSON.parse(jsonConfig);
};
