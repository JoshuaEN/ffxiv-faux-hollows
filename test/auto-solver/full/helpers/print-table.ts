// Mess with the depths so VSCode's Sticky Scroll keeps the header row separator visible

import EasyTable from "easy-table";
import { indent } from "~/test/helpers/print-helpers.js";

export function printTable(table: EasyTable, key: string, lines: string[]) {
  const tableRows = table.toString().split("\n");
  const tableHeaderRows = tableRows
    .slice(0, 1)
    .map((row) => row.replace(key, key + indent(1)));
  const tableBodyRows = tableRows.slice(1).map((row) => indent(1) + row);
  lines.push([...tableHeaderRows, ...tableBodyRows].join("\n"));
}
