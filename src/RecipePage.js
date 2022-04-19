import React, { useState } from "react";
import Editor from "./Editor";
import { useLocation } from "react-router-dom";
import { useQueryClient, useQuery } from "react-query";
import builtInRecipes from "./recipes";
import { useMutation } from "react-query";
import RecipeAlert from "./RecipeAlert";
import { fixChars } from "./support/fixChars";

function useDefaultQuery() {
  return new URLSearchParams(useLocation().search);
}

const RecipePage = (props) => {
  const { match, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const recipeId = match.params.recipeId;
  const queryClient = useQueryClient();
  const [alertMessage, setAlertMessage] = useState(undefined);
  const onSaveMutation = useMutation(
    async ({ modifiedRecipe }) => {
      const api = await dhis2.api();
      const versionInfo = await api.get("system/info");
      if (
        versionInfo.version === "2.30" ||
        versionInfo.version === "2.29" ||
        versionInfo.version === "2.28"
      ) {
        modifiedRecipe.code = fixChars(modifiedRecipe.code);
      }
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
        queryClient.invalidateQueries("fetchRecipe");
        setAlertMessage(undefined);
      },
      onError: (error) => {
        // not always an error, sometime just a string (ex page not found)
        console.log(error);
        setAlertMessage("The recipe couldn't be saved : " + error.message);
      },
    }
  );

  const isError = onSaveMutation?.isError;

  const fetchRecipeQuery = useQuery(["fetchRecipe", recipeId], async () => {
    const api = await dhis2.api();

    try {
      const response = await api.get("/dataStore/taskr/" + recipeId);
      return response;
    } catch (ignored) {
      const defaultRecipe = builtInRecipes.find(
        (recipe) => recipe.id === recipeId
      );
      return defaultRecipe || freshRecipe(recipeId);
    }
  });

  return (
    <div>
      <br />
      <RecipeAlert message={alertMessage} isError={isError} />

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
