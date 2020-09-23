import React, { useState, useEffect } from "react";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";
import marked from "marked";

const useStyles = makeStyles({
  search: {
    width: 280,
    margin: 10,
    paddingLeft: 10,
  },
  card: {
    minWidth: 275,
    maxWidth: 300,
    minHeight: 150,
    maxHeight: 250,
    margin: "10px",
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 18,
  },
  pos: {
    marginBottom: 12,
  },
});

function DocPage() {
  const classes = useStyles();
  const readmePath =
    "https://raw.githubusercontent.com/BLSQ/dhis2-taskr/user-manual/doc/user-manual.md";

  let [markdown, setMarkdown] = useState(null);
  useEffect(() => {
    fetch(readmePath)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        let imagePathPrefix =
          "https://raw.githubusercontent.com/BLSQ/dhis2-taskr/user-manual/doc/";
        let toReplace = /\.\//g;
        let nexText = text.replace(toReplace, imagePathPrefix);
        console.log(nexText);
        setMarkdown(marked(nexText));
      });
  }, [setMarkdown]);

  return (
    <>
      <Box
        display="flex"
        width="100%"
        justifyContent="flex-start"
        flexWrap="wrap"
        alignItems="flex-start"
        alignContent="space-around"
      >
        <article dangerouslySetInnerHTML={{ __html: markdown }}></article>
      </Box>
    </>
  );
}

export default DocPage;
