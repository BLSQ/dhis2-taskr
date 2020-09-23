import React, { useState, useEffect } from "react";
import Box from "@material-ui/core/Box";
import MarkdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkDownItHighlight from "markdown-it-highlightjs";
import "./DocPage.css";

const docPath =
  "https://raw.githubusercontent.com/BLSQ/dhis2-taskr/user-manual/doc/";
const readmePath = docPath + "/user-manual.md";

const slugify = s =>
  encodeURIComponent(
    String(s)
      .trim()
      .toLowerCase()
      .replace(/"/g, "")
      .replace(/:/g, " ")
      .replace(/,/g, "")
      .replace(/\?/g, "")
      .replace(/\./g, "")
      .replace(/\s+/g, "-")
  );

function DocPage({ match }) {
  let [markdown, setMarkdown] = useState(null);
  useEffect(() => {
    fetch(readmePath)
      .then(response => {
        return response.text();
      })
      .then(text => {
        const toReplace = /\.\//g;
        let fixedText = text
          .split("](#")
          .join(
            "](" + window.location.toString().replace(/\/#\/doc(.*)/, "/#doc/")
          );
        fixedText = fixedText.replace(toReplace, docPath);

        setMarkdown(
          new MarkdownIt()
            .use(MarkdownItAnchor, { slugify })
            .use(MarkDownItHighlight, { inline: true })
            .render(fixedText)
        );
        console.log(match);
        if (match.params.section) {
          setTimeout(function() {
            var ele = document.getElementById(match.params.section);
            if (ele) {
              window.scrollTo(ele.offsetLeft, ele.offsetTop);
            }
          }, 500);
        }
      });
  }, [match, setMarkdown]);

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
        <article
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: markdown }}
        ></article>
      </Box>
    </>
  );
}

export default DocPage;
