import { onMount } from "svelte";
import { getDispatch } from "@themislib/themis/svelte-store";

const dispatch = getDispatch();

onMount(() => {
  dispatch({ type: "todos/load" });
});