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

const RecipeGistPage = (props) => {
  const { match, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const recipeId = match.params.recipeId;
  const queryClient = useQueryClient();
  const [alertMessage, setAlertMessage] = useState(undefined);
  const onSaveMutation = useMutation(async ({ modifiedRecipe }) => {}, {
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
  });

  const isError = onSaveMutation?.isError;

  const fetchRecipeQuery = useQuery(["fetchRecipe", recipeId], async () => {
    const gistId = match.params.gistId;
    const gist = await fetch(
      `https://api.github.com/gists/${gistId}`
    ).then((response) => response.json());

    return {
      id: gistId,
      name: gist.description,
      editable: editable,
      code: gist.files["recipe.js"].content,
      params: gist.files["params.json"]
        ? JSON.parse(gist.files["params.json"].content)
        : [],
      report: gist.files["report.md"] ? gist.files["report.md"].content : "",
      gist,
    };
  });

  return (
    <div>
      <RecipeAlert message={alertMessage} isError={isError} />

      {fetchRecipeQuery.data && (
        <>
          <a href={fetchRecipeQuery.data.gist.html_url}>
            {fetchRecipeQuery.data.name}
          </a>
          <Editor
            key={fetchRecipeQuery.data.id}
            recipe={fetchRecipeQuery.data}
            dhis2={{}}
            onSave={onSaveMutation}
            editable={editable}
            autorun={autorun}
          />
        </>
      )}
    </div>
  );
};

export default RecipeGistPage;
