import { takeLatestFromSelector } from "@themislib/themis/saga";
import { selectReady } from "../todos-selectors";

function* readyWorker() {}

export function* todosSaga() {
  yield* takeLatestFromSelector(selectReady, readyWorker);
}