export const parseJSON = (str: string) => {
  let parsed = null;
  try {
    parsed = JSON.parse(str);
    if (typeof parsed === 'string') parsed = parseJSON(parsed);
    return parsed;
  } catch (e) {
    return parsed;
  }
};
