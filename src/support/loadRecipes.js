import { asyncForEach } from "./asyncForEach";

export const loadRecipes = async (dhis2, freshRecipe) => {
  const tasks = [];
  const api = await dhis2.api();
  try {
    const keys = await api.get("/dataStore/taskr");
    await asyncForEach(keys, async (key) => {
      const response = await fetch(
        api.baseUrl + "/dataStore/taskr/" + key,
        {
          headers: api.defaultHeaders,
        }
      );
      const buffer = await response.arrayBuffer();
      let decoder = new TextDecoder();
      let text = decoder.decode(buffer);
      const task = JSON.parse(text);
      task.local = true;
      tasks.push(task);
    });
  } catch (error) {
    console.log(error);
  }
  if (tasks.length === 0) {
    tasks.push(freshRecipe());
  }
  return tasks;
}
