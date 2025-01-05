import fs from 'fs';
import path from 'path';

export const generateRandomString = (length: number): string => {
  const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result: string = '';
  const charactersLength: number = characters.length;
  for (let i: number = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const generateUUID = (): string => {
  return generateRandomString(9)
}

// test uuid generation
// for (let i: number = 0; i < 10; i++) {
//   const randomString: string = generateRandomString(9);
//   console.log(randomString);
// }

export const readFilesRecursively = (dir: string) => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(readFilesRecursively(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

export interface Config {
  ip: string;
  port: number;
  music_dir: string;
  web_dir: string;
}
export const getConfig = (): Config => {
  const configPath = path.join(__dirname, '..', '/conf', 'config.json');
  // console.log(configPath);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config;
}

// test config reading
// const config = getConfig();
// console.log(config);