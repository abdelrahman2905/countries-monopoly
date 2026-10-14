// Generates src/data/shapes.json (SVG silhouettes) and copies flag SVGs to public/flags.
// Run with: node scripts/gen-assets.mjs   (needs the devDependencies installed)
import fs from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoMercator, geoPath, geoArea } from "d3-geo";
const require = createRequire(import.meta.url);

// iso2 -> name in world-atlas, minimum polygon size relative to the largest (drops far-away overseas bits)
const C = {
  ng: ["Nigeria"], ke: ["Kenya"], eg: ["Egypt"], ma: ["Morocco"], dz: ["Algeria"], th: ["Thailand"],
  vn: ["Vietnam"], id: ["Indonesia"], pk: ["Pakistan"], bd: ["Bangladesh"], in: ["India"],
  sa: ["Saudi Arabia"], ir: ["Iran"], tr: ["Turkey"], gr: ["Greece"], pl: ["Poland"], mx: ["Mexico"],
  co: ["Colombia"], ar: ["Argentina"], cl: ["Chile", 0.5], br: ["Brazil"], ca: ["Canada"],
  au: ["Australia"], es: ["Spain", 0.5], de: ["Germany"], fr: ["France", 0.5], it: ["Italy"],
  gb: ["United Kingdom"], jp: ["Japan"], cn: ["China"], us: ["United States of America", 0.5], ru: ["Russia"],
};

const topo = require("world-atlas/countries-110m.json");
const feats = feature(topo, topo.objects.countries).features;
const out = {};
for (const [iso, [name, minRatio = 0.02]] of Object.entries(C)) {
  const f = feats.find((x) => x.properties.name === name);
  if (!f) throw new Error("missing " + name);
  let polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const areas = polys.map((c) => geoArea({ type: "Polygon", coordinates: c }));
  const max = Math.max(...areas);
  polys = polys.filter((_, i) => areas[i] >= max * minRatio);
  const geo = { type: "MultiPolygon", coordinates: polys };
  // Russia spans the antimeridian: shift so the shape isn't split
  const proj = geoMercator().rotate(iso === "ru" ? [-100, 0] : [0, 0]).fitExtent([[4, 4], [96, 96]], geo);
  out[iso] = geoPath(proj)(geo).replace(/(\d+\.\d)\d+/g, "$1");
  fs.copyFileSync(`node_modules/flag-icons/flags/4x3/${iso}.svg`, `public/flags/${iso}.svg`);
}
fs.writeFileSync("src/data/shapes.json", JSON.stringify(out));
console.log("shapes:", Object.keys(out).length, "bytes:", fs.statSync("src/data/shapes.json").size);
