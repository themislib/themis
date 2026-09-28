import { onMount } from "svelte";
import { getDispatch } from "@themislib/themis/svelte-store";

onMount(() => {
  const dispatch = getDispatch();
  dispatch({ type: "todos/load" });
});