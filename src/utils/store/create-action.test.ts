import process from "node:process";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createAction, createAsyncAction } from "./create-action";

describe("createAction", () => {
  it("creates tuple payload actions and exposes a stable type", () => {
    const setName = createAction<[id: string, name: string]>("user/setName");

    expect(setName.type).toBe("user/setName");
    expect(setName.toString()).toBe("user/setName");
    expect(setName("u1", "Ada")).toEqual({
      type: "user/setName",
      payload: ["u1", "Ada"],
    });
  });

  it("uses payload modifiers as the public payload shape", () => {
    const rename = createAction(
      "user/rename",
      (id: string, name: string) => ({ id, name })
    );

    expect(rename("u1", "Ada")).toEqual({
      type: "user/rename",
      payload: { id: "u1", name: "Ada" },
    });
  });
});

describe("createAsyncAction", () => {
  it("increments sequence numbers when requests are created without a payload modifier", () => {
    const loadUser = createAsyncAction<[id: string]>("user/loadAsync", "user/load");
    const first = loadUser("u1");
    const second = loadUser("u2");
    const third = loadUser("u3");

    expect([first.seq, second.seq, third.seq]).toEqual([1, 2, 3]);
    expect(first.payload).toEqual(["u1"]);
    expect(second.payload).toEqual(["u2"]);
    expect(third.payload).toEqual(["u3"]);
    expectTypeOf(first.seq).toEqualTypeOf<number>();
  });

  it.each(["user/load", "user/refresh"])(
    "keeps counters independent for a separate %s creator",
    (stagesActionType) => {
      const firstCreator = createAsyncAction("user/loadAsync", "user/load");
      const secondCreator = createAsyncAction("user/loadAsync", stagesActionType);

      expect(firstCreator().seq).toBe(1);
      expect(firstCreator().seq).toBe(2);
      expect(secondCreator().seq).toBe(1);
      expect(firstCreator().seq).toBe(3);
      expect(secondCreator().seq).toBe(2);
    }
  );

  it("creates a request action with captured success payload", async () => {
    const loadUser = createAsyncAction<[id: string], { id: string }, { name: string }>(
      "user/loadAsync",
      "user/load",
      (id) => ({ id })
    );

    const request = loadUser("u1");
    const resolution = expect(request.promise).resolves.toEqual({ name: "Ada" });

    expect(loadUser.type).toBe("user/load");
    expect(loadUser.asyncActionType).toBe("user/loadAsync");
    expect(request.type).toBe("user/load");
    expect(request.asyncActionType).toBe("user/loadAsync");
    expect(request.seq).toBe(1);
    expect(request.payload).toEqual({ id: "u1" });
    expect(request.success.type).toBe("user/load_SUCCESS");
    expect(request.success.toString()).toBe("user/load_SUCCESS");
    expectTypeOf(request.success.type).toEqualTypeOf<string>();
    expectTypeOf<ReturnType<typeof request.success>>().not.toHaveProperty("seq");
    expectTypeOf<ReturnType<typeof request.success>["payload"]["seq"]>().toEqualTypeOf<number>();
    const success = request.success({ name: "Ada" });
    expect(success).not.toHaveProperty("seq");
    expect(success).toEqual({
      type: "user/load_SUCCESS",
      payload: {
        request: { id: "u1" },
        response: { name: "Ada" },
        seq: request.seq,
      },
    });
    await resolution;
  });

  it("creates captured failure actions that reject the request promise", async () => {
    const loadUser = createAsyncAction<[id: string], { id: string }, { name: string }>(
      "user/loadAsync",
      "user/load",
      (id) => ({ id })
    );
    const request = loadUser("u1");
    const error = new Error("boom");
    const rejection = expect(request.promise).rejects.toBe(error);

    expect(request.failure.type).toBe("user/load_FAILURE");
    expect(request.failure.toString()).toBe("user/load_FAILURE");
    expectTypeOf(request.failure.type).toEqualTypeOf<string>();
    expectTypeOf<ReturnType<typeof request.failure>>().not.toHaveProperty("seq");
    expectTypeOf<ReturnType<typeof request.failure>["payload"]["seq"]>().toEqualTypeOf<number>();
    const failure = request.failure(error);
    expect(failure).not.toHaveProperty("seq");
    expect(failure).toEqual({
      type: "user/load_FAILURE",
      payload: {
        request: { id: "u1" },
        error,
        seq: request.seq,
      },
    });
    await rejection;
  });

  it("preserves request sequences when bound completions arrive out of order", async () => {
    const loadUser = createAsyncAction<[id: string], { id: string }, string>(
      "user/loadAsync",
      "user/load",
      (id) => ({ id })
    );
    const first = loadUser("u1");
    const second = loadUser("u2");
    const third = loadUser("u3");
    const error = new Error("second failed");

    expect(third.success("Grace")).toEqual({
      type: "user/load_SUCCESS",
      payload: { request: { id: "u3" }, response: "Grace", seq: 3 },
    });
    expect(second.failure(error)).toEqual({
      type: "user/load_FAILURE",
      payload: { request: { id: "u2" }, error, seq: 2 },
    });
    expect(first.success("Ada")).toEqual({
      type: "user/load_SUCCESS",
      payload: { request: { id: "u1" }, response: "Ada", seq: 1 },
    });

    await expect(first.promise).resolves.toBe("Ada");
    await expect(second.promise).rejects.toBe(error);
    await expect(third.promise).resolves.toBe("Grace");
    expect([first.seq, second.seq, third.seq]).toEqual([1, 2, 3]);
    expect(loadUser("u4").seq).toBe(4);
  });

  it("sequences bound completion payloads without a payload modifier", async () => {
    const loadUser = createAsyncAction<[id: string]>("user/loadAsync", "user/load");
    const first = loadUser("u1");
    const second = loadUser("u2");
    const error = new Error("second failed");

    expect(second.failure(error)).toEqual({
      type: "user/load_FAILURE",
      payload: { request: ["u2"], error, seq: 2 },
    });
    expect(first.success("Ada")).toEqual({
      type: "user/load_SUCCESS",
      payload: { request: ["u1"], response: "Ada", seq: 1 },
    });
    await expect(first.promise).resolves.toBe("Ada");
    await expect(second.promise).rejects.toBe(error);
    expect([first.seq, second.seq]).toEqual([1, 2]);
  });

  it("observes ignored rejections without changing the original promise", async () => {
    const loadUser = createAsyncAction<string>("user/loadAsync", "user/load");
    const request = loadUser();
    const promise = request.promise;
    const error = new Error("ignored failure");
    const onUnhandledRejection = vi.fn();
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      request.failure(error);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onUnhandledRejection).not.toHaveBeenCalled();
      expect(request.promise).toBe(promise);
      await expect(promise).rejects.toBe(error);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });

  it("exposes static success and failure action creators", () => {
    const loadUser = createAsyncAction<[id: string], { id: string }, { name: string }>(
      "user/loadAsync",
      "user/load",
      (id) => ({ id })
    );
    const error = new Error("boom");

    expect(loadUser("u1").seq).toBe(1);
    expect(loadUser.success.type).toBe("user/load_SUCCESS");
    expect(loadUser.success.toString()).toBe("user/load_SUCCESS");
    expect(loadUser.failure.type).toBe("user/load_FAILURE");
    expect(loadUser.failure.toString()).toBe("user/load_FAILURE");
    expect(loadUser.success({ name: "Ada" })).toEqual({
      type: "user/load_SUCCESS",
      payload: { request: undefined, response: { name: "Ada" } },
    });
    expect(loadUser.failure(error)).toEqual({
      type: "user/load_FAILURE",
      payload: { request: undefined, error },
    });
    expect(loadUser("u2").seq).toBe(2);
    expectTypeOf<ReturnType<typeof loadUser.success>>().not.toHaveProperty("seq");
    expectTypeOf<ReturnType<typeof loadUser.failure>>().not.toHaveProperty("seq");
    expectTypeOf<ReturnType<typeof loadUser.success>["payload"]>().not.toHaveProperty("seq");
    expectTypeOf<ReturnType<typeof loadUser.failure>["payload"]>().not.toHaveProperty("seq");
  });
});