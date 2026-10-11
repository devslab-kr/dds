import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const json = async (path) => JSON.parse(await read(path));

test("React packages share DDS version/license but do not introduce grid or React into Solid", async () => {
  const foundation = await json("packages/dds-tokens/package.json");
  const fixed = (await json(".changeset/config.json")).fixed[0];
  for (const name of ["dds-react", "dds-table-react"]) {
    const p = await json(`packages/${name}/package.json`);
    assert.equal(p.name, `@devslab/${name}`);
    assert.equal(p.version, foundation.version);
    assert.equal(p.license, "SEE LICENSE IN LICENSE");
    assert.ok(fixed.includes(p.name));
    assert.equal(p.publishConfig.provenance, true);
    assert.ok(p.exports["./styles.css"]);
    assert.ok(p.peerDependencies.react);
    assert.ok(p.peerDependencies["react-dom"]);
    assert.equal(
      p.dependencies?.react,
      undefined,
      "React remains consumer-owned",
    );
    assert.equal(p.dependencies?.["ag-grid-enterprise"], undefined);
  }
  const ui = await json("packages/dds-react/package.json");
  assert.equal(ui.dependencies["@ark-ui/react"], "5.39.3");
  assert.equal(ui.dependencies["ag-grid-community"], undefined);
  const grid = await json("packages/dds-table-react/package.json");
  assert.equal(
    grid.dependencies["ag-grid-react"],
    grid.dependencies["ag-grid-community"],
  );
  assert.equal(grid.dependencies["ag-grid-react"], "36.2.0");
  for (const dir of ["dds-solid", "dds-table"]) {
    const solid = await json(`packages/${dir}/package.json`);
    assert.equal(solid.dependencies?.["ag-grid-react"], undefined);
    assert.equal(solid.dependencies?.["@ark-ui/react"], undefined);
    assert.equal(solid.peerDependencies?.react, undefined);
  }
});
