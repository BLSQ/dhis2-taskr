import React, { useState } from "react";
import Editor from "./Editor";
import {
  useLocation,
} from "react-router-dom";
import { useQuery } from "react-query";
import builtInRecipes from "./recipes";

function useDefaultQuery() {
  return new URLSearchParams(useLocation().search);
}

const RecipePage = (props) => {
  const { match, onSave, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const [recipe, setRecipe] = useState(undefined);
  const defaultRecipe = builtInRecipes.filter((recipe) => recipe.id === match.params.recipeId)

  const fetchRecipeQuery = useQuery("fetchRecipe", 
    async () => {
      const api = await dhis2.api()
      const response = await api.get("/dataStore/taskr/" + match.params.recipeId);
      return response;
    }, 
    {
      onSuccess: (response) => {
        setRecipe(response);
      },
      onError: (error) => {
        if (error.httpStatusCode === 404) {
          setRecipe(defaultRecipe.length ? defaultRecipe[0] : freshRecipe());
        }
      }
    },
    {
      retry: false
    }
  )

  return (
    <>
    {recipe && (
      <Editor
        key={recipe.id}
        recipe={recipe}
        dhis2={dhis2}
        onSave={onSave}
        editable={editable}
        autorun={autorun}
      />
    )}
    </>
  );
}

export default RecipePage;