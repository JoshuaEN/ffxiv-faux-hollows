import fs from "fs";
import path from "path";
export function getProjectRoot() {
  let dir = import.meta.dirname;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return path.resolve(dir);
    }
    const parentDir = path.dirname(dir);
    if (dir === parentDir) {
      throw new Error(`Failed to locate project root`);
    }
    dir = parentDir;
  }
}
