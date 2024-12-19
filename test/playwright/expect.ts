export { test } from "@playwright/test";
// https://stackoverflow.com/a/9310752
function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
export function includeClass(expected: string) {
  return new RegExp(`(^|\\s)${escapeRegExp(expected)}(\\s|$)`);
}
