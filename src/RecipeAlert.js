import React, { useState } from "react";
import { Collapse, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Alert from '@material-ui/lab/Alert';

const RecipeAlert = (props) => {
  const { message, isError, setOpen, open } = props;
  const alertSeverity = (isError ? "error" : "success");

  return (
    <>
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
          {message}
        </Alert>
      </Collapse>
    </>
  )
}

export default RecipeAlert;