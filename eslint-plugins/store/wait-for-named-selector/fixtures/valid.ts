import { waitFor } from "@themislib/themis/saga";
import { selectReady } from "../todos-selectors";

export function* todosSaga() {
  yield* waitFor(selectReady, [], (ready) => ready === true, 5000);
}