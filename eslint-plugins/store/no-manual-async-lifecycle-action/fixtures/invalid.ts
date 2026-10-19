import { createAction } from "@themislib/themis/utils/store/create-action";

export const loadTodoStarted = createAction("todos/load");
export const loadTodo = createAction("todos/loadSucceeded");
export const LOAD_TODO_PENDING = createAction("todos/load");
export const loadFailure = createAction("todos/LOAD_FAILURE");