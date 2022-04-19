
export const loadRecipes = async (dhis2, freshRecipe) => {
  const tasks = [];
  const api = await dhis2.api();
  try {
    const keys = await api.get("/dataStore/taskr");

    for (let key of keys) {
      const task = await api.get("/dataStore/taskr/" + key);
      task.local = true;
      tasks.push(task);
    }
  } catch (error) {
    console.log(error);
  }
  if (tasks.length === 0) {
    tasks.push(freshRecipe());
  }
  return tasks;
};
