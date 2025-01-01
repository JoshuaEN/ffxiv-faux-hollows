import fs from "fs";
import path from "path";
export function getProjectRoot() {
  let dir = import.meta.dirname;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parentDir = path.dirname(dir);
    if (dir === parentDir) {
      throw new Error(`Failed to locate project root`);
    }
    dir = parentDir;
  }
}
