import React from "react";

import IdyllDocument from "idyll-document";
import * as components from "idyll-components";
import IdyllVegaLite from "idyll-vega-lite";

const availableComponents = {
  ...components,
  IdyllVegaLite: IdyllVegaLite
};

const IdyllReport = () => {
  return (
    <IdyllDocument
      theme="github"
      markup={`
# hello


[var name:"myVar" value:false /]

[Boolean value:myVar /]

[Equation]
  y = \\int x^2 dx
[/Equation]


Checkbox [Display value:\`myVar ? "is checked." : "isn't checked."  \`/]

[Graphic style:\`{width: "350px"}\`]
    [Chart type:"line"  data:dataToBeCharted domain:\`[0, 8]\` range:\`[0, 1]\` /]
[/Graphic]

[Chart
    equation:\` (t) => Math.sin(t)\`
    domain:\`[0, 2 * Math.PI]\`
    samplePoints:1000 /]



`}
      components={availableComponents}
      datasets={{
        myData: "FAKE_DATA",
        dataToBeCharted: [
          { x: 0, y: 0.5 },
          { x: 3.5, y: 0.5 },
          { x: 4, y: 0 },
          { x: 4.5, y: 1 },
          { x: 5, y: 0.5 },
          { x: 8, y: 0.5 }
        ]
      }}
    />
  );
};

export default IdyllReport;
