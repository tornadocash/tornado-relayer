import fs from 'fs/promises';
import path from 'path';

export default async (pathToFile: string) => {
  try {
    const file = await fs.readFile(path.resolve(__dirname, pathToFile), { encoding: 'utf8' });
    return JSON.parse(file);
  } catch (e) {
    console.log(e);
    return null;
  }
};
