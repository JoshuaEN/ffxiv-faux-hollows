export const bestSolver = "community-data-fox-omits";
export const solvers = [
  bestSolver,
  "community-data-buckets",
  "community-data-buckets-fixed-weight",
  "community-data-weighted",
  "community-data-perfect",
  "community-data-perfect-punish-empty",
  "community-data",
  "pure-weighted",
];
export const bestWeighter = "s6p4-f1";
export const weighters = [bestWeighter, "s6p4f1_noOverride", "s6p4f1"];

export const map = [
  [solvers[0], weighters],
  [solvers[1], [bestWeighter]],
  [solvers[2], [bestWeighter]],
  [solvers[3], [bestWeighter]],
  [solvers[4], [bestWeighter]],
  [solvers[5], [bestWeighter]],
  [solvers[6], [bestWeighter]],
  [solvers[7], [bestWeighter]],
];

if (map.length !== solvers.length) {
  throw new Error(`Map mismatch`);
}
