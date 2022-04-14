import React, { useState } from "react";
import Editor from "./Editor";
import { useLocation } from "react-router-dom";
import { useQueryClient, useQuery } from "react-query";
import builtInRecipes from "./recipes";
import { useMutation } from "react-query";
import { Collapse, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Alert from '@material-ui/lab/Alert';

function useDefaultQuery() {
  return new URLSearchParams(useLocation().search);
}

const RecipePage = (props) => {
  const { match, editable, dhis2, freshRecipe } = props;
  const query = useDefaultQuery();
  const autorun = query.get("autorun") === "true";
  const recipeId = match.params.recipeId
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

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
        setOpen(true)
        setAlertMessage("Recipe saved successfully")
        queryClient.invalidateQueries("loadRecipes");
      },
      onError: (error) => {
        setOpen(true)
        setAlertMessage(error.message)
        console.log(error);
      }
    }
  )

  const alertSeverity = onSaveMutation?.isSuccess ? "success" : "error";

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
      <br/>
      <Collapse in={open}>
        <Alert
          severity={alertSeverity}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setOpen(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {alertMessage}
        </Alert>
      </Collapse>

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
