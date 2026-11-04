import assert from "node:assert/strict";
import { rendered } from "./fixture.mts";

assert.equal(rendered.subject, "Preview");
