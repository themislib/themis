import { waitFor } from "@themislib/themis/saga";

export function* todosSaga() {
  yield* waitFor((state) => state.todos.ready, [], (ready) => ready === true, 5000);
}