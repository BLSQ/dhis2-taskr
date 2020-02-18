import React, { useEffect } from "react";
import MarkdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItToc from "@liradb2000/markdown-it-toc-done-right";
import uslug from "uslug";
import MarkdownItApexCharts, { ApexRender } from "markdown-it-apexcharts";
import MarkdownItMermaid from "@liradb2000/markdown-it-mermaid";
import "./Markdown.css";
import DOMPurify from "dompurify";
import MarkdownItFootnote from "markdown-it-footnote";

import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";

const uslugify = s => uslug(s);

const styles = theme => ({
  preview: {
    margin: "50px 100px",
    [theme.breakpoints.down("xs")]: {
      margin: "0px 0px"
    }
  }
});

const renderMarkdown = text => {
  var md = MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
    xhtmlOut: false
  });
  md.use(MarkdownItAnchor, {
    level: [1, 2, 3],
    slugify: uslugify,
    permalink: true,
    // renderPermalink: (slug, opts, state, permalink) => {},
    permalinkClass: "material-icons anchor",
    permalinkSymbol: "link",
    permalinkBefore: false
  })
    .use(MarkdownItToc, {
      level: [1, 2],
      slugify: uslugify
    })
    .use(MarkdownItMermaid)
    .use(MarkdownItFootnote)
    .use(MarkdownItApexCharts);

  return md.render(text ? text : "");
};

const MarkdownPreview = props => {
  const { classes } = props;

  useEffect(() => {
    ApexRender();
  });

  return (
    <div
      className={classNames("markdown-body", classes.preview)}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(renderMarkdown(props.text))
      }}
    ></div>
    // <div className="markdown-body" dangerouslySetInnerHTML={{__html:renderMarkdown(props.text)}}></div>
  );
};

export default withStyles(styles)(MarkdownPreview);
