import React from "react";
import Editor from "./Editor";
import { useLocation } from "react-router-dom";
import { useQueryClient, useQuery } from "react-query";
import builtInRecipes from "./recipes";
import { useMutation } from "react-query";


function useDefaultQuery() {
  return new URLSearchParams(useLocation().search);
}

const RecipePage = (props) => {
  const { match, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const recipeId = match.params.recipeId
  const queryClient = useQueryClient();

  const onSaveMutation = useMutation(
    async ({ modifiedRecipe }) => {
      const api = await dhis2.api();
      try {
        const createResp = await api.post(
          "/dataStore/taskr/" + modifiedRecipe.id,
          modifiedRecipe
        );
        delete modifiedRecipe.fresh;
      } catch (error) {}

      const updateResp = await api.update(
        "/dataStore/taskr/" + modifiedRecipe.id,
        modifiedRecipe
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("loadRecipes");
        window.location.replace("/")
      },
      onError: (error) => {
        console.log(error);
      }
    }
  )

  const fetchRecipeQuery = useQuery(
    ["fetchRecipe", recipeId],
    async () => {
      const api = await dhis2.api();

      try {
        const response = await api.get(
          "/dataStore/taskr/" + recipeId
        );
        return response;
      } catch (ignored) {
        const defaultRecipe = builtInRecipes.find(
          (recipe) => recipe.id === recipeId
        );
        return defaultRecipe || freshRecipe(recipeId);
      }
    }
 );

  return (
    <div>    
      {fetchRecipeQuery.data && (
        <Editor
          key={fetchRecipeQuery.data.id}
          recipe={fetchRecipeQuery.data}
          dhis2={dhis2}
          onSave={onSaveMutation}
          editable={editable}
          autorun={autorun}
        />
      )}
    </div>
  );
};

export default RecipePage;
