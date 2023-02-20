// Deletes eslintrc config files from node_modules because of bugs in ESLint cause it to detect these
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function rm(parentPath) {
  for (const subPath of fs.readdirSync(parentPath)) {
    const fullSubPath = path.join(parentPath, subPath);
    if (fs.statSync(fullSubPath).isFile()) {
      if (subPath === ".eslintrc") {
        console.log("rm", fullSubPath);
        fs.rm(fullSubPath);
      }
    } else {
      rm(fullSubPath);
    }
  }
}
rm(path.join(__dirname, "..", "node_modules"));
