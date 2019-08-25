const path = require('path');
const fs = require('smart-fs');

module.exports.getDirectories = (dir) => fs.readdirSync(dir)
  .filter((subDir) => fs.lstatSync(path.join(dir, subDir)).isDirectory());
