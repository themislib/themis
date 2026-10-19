import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const repositoryRoot = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, repositoryRoot), "utf8");
}

describe("async action guidance", () => {
  it("keeps the canonical creator decision, lint rule, and reviewed exception aligned", async () => {
    const [router, actions, reducersSkill, sagasSkill, reducersDocs, sagasDocs, testingDocs] = await Promise.all([
      source("skills/SKILL.md"),
      source("skills/core/actions/SKILL.md"),
      source("skills/core/reducers/SKILL.md"),
      source("skills/core/sagas/SKILL.md"),
      source("docs/REDUCERS.md"),
      source("docs/SAGAS.md"),
      source("docs/TESTING.md"),
    ]);

    expect(router).toContain("./core/actions/SKILL.md");
    expect(actions).toContain("Choose before implementing");
    expect(actions).toContain("Migration from parallel lifecycle creators");
    expect(actions).toContain("themis/no-manual-async-lifecycle-action");
    expect(actions).toContain("request correlation and promise settlement");
    expect(actions).toContain("eslint-disable-next-line themis/no-manual-async-lifecycle-action -- reason");
    expect(reducersSkill).toContain("request creator plus its `.success` and `.failure` stages");
    expect(sagasSkill).toContain("request instance's `action.success(...)` or `action.failure(...)`");
    expect(sagasSkill).toContain("loadTodos.success");
    for (const document of [reducersDocs, sagasDocs]) {
      expect(document).toContain("themis/no-manual-async-lifecycle-action");
      expect(document).toContain("request correlation and promise settlement");
      expect(document).toContain("broad suppression");
    }
    expect(reducersDocs).toContain("store.dispatch(operation(...))");
    expect(testingDocs).toContain("put(action.success(items))");
    expect(testingDocs).toContain("put(action.failure(error))");
    for (const guidance of [sagasSkill, sagasDocs]) {
      expect(guidance).toContain("refreshTriggered");
      expect(guidance).not.toContain("refreshRequested");
    }
  });
});