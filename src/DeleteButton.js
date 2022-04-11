import React, { useState } from "react";
import { useMutation, useQuery } from "react-query";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import _ from "./support/lodash";

const DeleteButton = (props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { dhis2, recipe } = props;

  const deleteButtonStyle = {
    marginLeft: "40rem"
  }

  const fetchRecipeQuery = useQuery("fetchRecipe", async () => {
    const api = await dhis2.api()
    await api.get("/dataStore/taskr/" + recipe.id)
  },
  {
    retry: false
  });

  const recipeExists = fetchRecipeQuery?.isSuccess

  const handleDeleteMutation = useMutation(
    async () => {
      _.downloadFile({
        data: JSON.stringify(recipe),
        fileName: `recipe-${recipe.id}.json`,
        fileType: 'text/json',
      })
      const api = await dhis2.api();
      await api.delete(
        "/dataStore/taskr/" + recipe.id,
        recipe 
      )
    },
    {
      onSuccess: (apiResponse) => {
        window.location.replace("/#/recipes")
        window.location.reload()
      },
      onError: (error) => {
        alert("There was a problem")
      }
    }
  )
  return (
    <span style={deleteButtonStyle} >
      <Button onClick={() => setConfirmOpen(true)} variant="contained" color="secondary" disabled={!recipeExists || !recipe.local}>
        Delete
      </Button>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} aria-labelledby="confirm-dialog">
        <DialogContent>
          "Are you sure that you want to delete this recipe? A JSON file will be automatically downloaded as a back-up."
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              handleDeleteMutation.mutate();
            }}
            color="primary"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </span>
  );
};
export default DeleteButton;
