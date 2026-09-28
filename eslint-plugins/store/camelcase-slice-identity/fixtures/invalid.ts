import { ReactStore } from "@themislib/themis/react-store";
import { Store } from "@themislib/themis/svelte-store";
import { StreamingStore } from "@themislib/themis/streaming-store";
import { createAction, createAsyncAction } from "@themislib/themis/utils/store/create-action";
import { todoItemsReducer } from "./todo-items-slice";

export const addTodo = createAction("todo-items/add");
export const loadTodo = createAsyncAction("TodoItems/load", "todo_items/loadSuccess", async () => ({}));

const reducers = { TodoItems: todoItemsReducer };

export const store = new Store({ "todo-items": todoItemsReducer, todo_items: todoItemsReducer });
export const reactStore = new ReactStore(reducers);
export const streamingStore = new StreamingStore({ ["TodoItems"]: todoItemsReducer });