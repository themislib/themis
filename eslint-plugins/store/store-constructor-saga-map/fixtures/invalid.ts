import { Store } from "@themislib/themis/svelte-store";
import { todosSaga } from "./sagas/todos-saga";
import { todosReducer } from "./todos-slice";

const sagas = { todos: todosSaga };

export const store = new Store({ todos: todosReducer }, sagas);