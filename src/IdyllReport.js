import React from "react";

import IdyllDocument from "idyll-document";
import * as components from "idyll-components";
import IdyllVegaLite from "idyll-vega-lite";

import OrgunitMap from "./OrgunitMap";

const AsJSON = props => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const FlexBox = props => {
  const { idyll, hasError, updateProps, data, ...otherProps } = props;

  return (
    <div
      style={{
        display: "flex"
      }}
    >
      {props.children.map(item => (
        <div style={{padding: "10px"}}>{item}</div>
      ))}
    </div>
  );
};

const availableComponents = {
  ...components,
  IdyllVegaLite: IdyllVegaLite,
  AsJSON: AsJSON,
  OrgunitMap: OrgunitMap,
  FlexBox: FlexBox
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

[AsJSON data:dataToBeCharted /]

[Graphic style:\`{width: "350px"}\`]
[Chart
    equation:\` (t) => Math.sin(t)\`
    domain:\`[0, 2 * Math.PI]\`
    samplePoints:1000 /]

[/Graphic]

[var name:"myVar" value:false /]
[FlexBox]
  [OrgunitMap lines:testOrgunits showableMap:true position:\`[-12.9487, 9.0131]\` width:"350px" height:"350px"/]
  [OrgunitMap lines:\`testOrgunits.slice(1,2)\` showableMap:true position:\`[-12.9487, 9.0131]\` width:"350px" height:"350px"/]
  [OrgunitMap lines:\`testOrgunits.slice(3,4)\` showableMap:true position:\`[-12.9487, 9.0131]\` width:"350px" height:"350px"/]
[/FlexBox]
`}
      components={availableComponents}
      initialState={{
        myData: "FAKE_DATA",
        dataToBeCharted: [
          { x: 0, y: 0.5 },
          { x: 3.5, y: 0.5 },
          { x: 4, y: 0 },
          { x: 4.5, y: 1 },
          { x: 5, y: 0.5 },
          { x: 8, y: 0.5 }
        ],
        testOrgunits: [
          { name: "Bujumbura, Burundi", coordinates: "[29.3599, -3.3614]" },
          { name: "Paris, France", coordinates: "[2.3522, 48.8566]" },
          { name: "Berlin, Germany", coordinates: "[13.405, 52.52]" },
          { name: "Kinshasa, DRC", coordinates: "[15.2663, -4.4419]" },
          { name: "Senegal", coordinates: "[-14.4392276, 14.5001717]" }
        ]
      }}
    />
  );
};

export default IdyllReport;
