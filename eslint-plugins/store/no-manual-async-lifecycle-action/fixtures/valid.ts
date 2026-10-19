import { createAction, createAsyncAction } from "@themislib/themis/utils/store/create-action";

export const saveTodo = createAction("todos/save");
export const requestAudit = createAction("audit/request");
export const setSpending = createAction("finance/setSpending");
export const gameRestarted = createAction("games/restarted");
export const GAME_RESTARTED = createAction("games/GAME_RESTARTED");
export const loadTodo = createAsyncAction("todos/loadAsync", "todos/load");