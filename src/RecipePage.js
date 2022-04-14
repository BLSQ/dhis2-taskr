import React, { useState } from "react";
import Editor from "./Editor";
import { useLocation } from "react-router-dom";
import { useQuery } from "react-query";
import builtInRecipes from "./recipes";

function useDefaultQuery() {
  return new URLSearchParams(useLocation().search);
}

const RecipePage = (props) => {
  const { match, onSave, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const recipeId = match.params.recipeId

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
        return defaultRecipe || freshRecipe();
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
          onSave={onSave}
          editable={editable}
          autorun={autorun}
        />
      )}
    </div>
  );
};

export default RecipePage;
