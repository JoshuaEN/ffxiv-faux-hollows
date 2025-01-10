import sharp from "sharp";
import { Plugin } from "vite";

export function imageSizePlugin(): Plugin {
  return {
    name: "image size plugin",
    enforce: "pre",
    async load(id) {
      const index = id.indexOf("?");
      if (index < 0 || id.slice(index + 1) !== "metadata") {
        return null;
      }

      const cleanedId = id.slice(0, index);

      const metadata = await sharp(cleanedId).metadata();
      return `export default ${JSON.stringify({ height: metadata.height, width: metadata.width })};`;
    },
  };
}
