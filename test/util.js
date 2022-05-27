import path from 'path';
import fs from 'smart-fs';

export const getDirectories = (dir) => fs.readdirSync(dir)
  .filter((subDir) => fs.lstatSync(path.join(dir, subDir)).isDirectory());
