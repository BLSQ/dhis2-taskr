import React, { useState, useEffect } from "react";
import { Collapse, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Alert from '@material-ui/lab/Alert';

const RecipeAlert = (props) => {
  const { message, isError } = props;
  const [open, setOpen] = useState(false);
  const alertSeverity = (isError ? "error" : "success");

  useEffect(() => {
    setOpen(message !== undefined)
  }, [message]);

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