const recipes = [
  {
    id: "D5a1DVMw7FV",
    name: "empty",
    editable: true,
    code: `
    const api = await dhis2.api();
    const ou = await api.get("organisationUnits", {
      fields: "id,name,ancestors[id,name],geometry"
    });

    return _.flattenObjects(ou.organisationUnits, ["geometry"]);
      `
  },
  {
    id: "lD3mlYe0S0X",
    name: "Basic - Access api",
    code: `
  const api = await dhis2.api();
  const ou = await api.get("organisationUnits", {
    fields: "id,name",
    paging: false
  });
  return ou.organisationUnits
      `
  },
  {
    id: "u2Rzyn9ZvfD",
    name: "Basic - List of orgunits with ancestors and groups",
    editable: false,
    code: `

  const api = await dhis2.api();
  const organisationUnitsResp = await api.get("organisationUnits", {
    fields: "id,name,ancestors[id,name],organisationUnitGroups[id,name]",
    paging: false
  });
  const organisationUnits =  organisationUnitsResp.organisationUnits.map(ou => {
      return {
          id: ou.id,
          name: ou.name,
          level0: ou.ancestors[0] && ou.ancestors[0].name,
          level1: ou.ancestors[1] && ou.ancestors[1].name,
          level2: ou.ancestors[2] && ou.ancestors[2].name,
          level3: ou.ancestors[3] && ou.ancestors[3].name,
          level4: ou.ancestors[4] && ou.ancestors[4].name,
          groups: ou.organisationUnitGroups.map(g => g.name).sort().join(", ")
      };
  });
  return organisationUnits
  `
  },
  {
    id: "noCPOHibwHt",
    name: "Basic - List all available resources",
    code: `
const api = await dhis2.api();

const resources = await api.get("resources")
return resources.resources.map( r => {
    return {
        name: r.displayName,
        snippet: 'const '+r.plural+'Resp = await api.get("'+r.plural+'")'
    }
})

    `
  },
  {
    id: "RWYYgYTGumd",
    name: "Basic - Super user audit",
    editable: true,
    code: `
    const api = await dhis2.api();

    const userResp = await api.get("users", {
      fields:
        "id,name,email,userCredentials[userRoles[id,name],lastLogin],organisationUnits[id,name,level],created",
      filter: "userCredentials.disabled:eq:false",
      paging: false
    });
    const users = userResp.users
      .map(user => {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          superuser: user.userCredentials.userRoles.some(role =>
            ["Superuser", "Administrateur Principal"].includes(role["name"])
          )
            ? "true"
            : "",
          manageOrganisationUnits: user.organisationUnits
            .map(ou => ou.name)
            .join(", "),
          roles: user.userCredentials.userRoles.map(r => r.name).join(", "),
          created: user.created,
          lastLogin: user.userCredentials.lastLogin
        };
      })
      .sort((a, b) => (a.superuser ? -1 : b.super_user ? -1 : 1));

    const date = new Date();
    const newDate = new Date(date.setMonth(date.getMonth() - 6));
    const loginDate =  date.toJSON().substring(0, 7)

    report.register("superusers", users.filter(u => u.superuser));
    report.register("created_notloggedin", users.filter(u => u.lastLogin == undefined));
    report.register("oldLastLogin", users.filter(u => u.lastLogin && u.lastLogin <= loginDate ));
    report.register("users", users);

    return "";


  `,
    report: `
# Admin users

Limit the admin users to a small number

[DataTable data:superusers label:"Admin users" perPage:50/]

# Users created but never logged in

User created but that never logged in. If they were created long time a ago, it's probably safer to disable them.

[DataTable data:created_notloggedin label:"Created but never logged in" perPage:20/]

# Last login more than 6 months

These users didn't logged in since a while. It's probably safer to disable them.

[DataTable data:oldLastLogin label:"Login more than 6 months" perPage:20/]

# All enabled users

You might want to audit the roles and orgunits of existing users

[DataTable data:users label:"All users" perPage:20/]


`
  },
  {
    id: "bifaoG4Ky23",
    name: "Investigate GEOJSON data quality",
    editable: false,
    code: `
      const api = await dhis2.api();
      const ou = await api.get("organisationUnits", {
        fields: "id,name,coordinates,featureType",
        paging: false
      });
      ou.organisationUnits.forEach(ou => {
        ou.guessedFeatureType =
          ou.coordinates === undefined
            ? "NONE"
            : ou.coordinates.startsWith("[[[[")
            ? "MULTI_POLYGON"
            : ou.coordinates.startsWith("[[[")
            ? "POLYGON"
            : ou.coordinates.startsWith("[[")
            ? "LINE"
            : ou.coordinates.startsWith("[")
            ? "POINT"
            : "NONE";

        ou.featureTypeMatches = ou.guessedFeatureType === ou.featureType;
      });
      return ou.organisationUnits.filter(ou => ou.featureTypeMatches == false);
    `
  },
  {
    id: "d4pmpo12iMp",
    name: "Audit coordinates",
    editable: true,
    code: `
    const stats = [];
    const api = await dhis2.api();

    const levels = await api.get("organisationUnitLevels", {
      fields: "id,name,level",
      order: "level"
    });

    const system = await api.get("system/info");
    const version = system.version;
    const v = version.split(".");
    const vfloat = parseFloat(v[0] + "." + v[1]);
    const fieldCoordinates = vfloat >= 2.32 ? "geometry" : "coordinates";

    await asyncForEach(levels.organisationUnitLevels, async level => {
      const withCoordinates = await api.get("organisationUnits", {
        fields: "id,name",
        filter: ["level:eq:" + level.level, fieldCoordinates + ":!null"],
        paging: true,
        pageSize: 1
      });
      const withoutCoordinates = await api.get("organisationUnits", {
        fields: "id,name",
        filter: ["level:eq:" + level.level, fieldCoordinates + ":null"],
        paging: true,
        pageSize: 1
      });

      const allOus = await api.get("organisationUnits", {
        fields: "id,name",
        filter: ["level:eq:" + level.level],
        paging: true,
        pageSize: 1
      });

      stats.push({
        levelName: level.name,
        level: level.level,
        withCoordinates: withCoordinates.pager.total,
        withoutCoordinates: withoutCoordinates.pager.total,
        totalOrganisationUnits: allOus.pager.total,
        percentageCoordinates:
          allOus.pager.total > 0
            ? ((withCoordinates.pager.total / allOus.pager.total) * 100).toFixed(2)
            : "-"
      });
      report.register("statsByLevel" + level.level, [
        { x: "with", y: withCoordinates.pager.total },
        { x: "without", y: withoutCoordinates.pager.total }
      ]);
    });

    return stats;


 `,

    report: `

 [FlexBox]
# Level 1
[FlexBox]
[Chart type:"pie" data:statsByLevel1 colorScale:\`["green", "grey" ]\` /]
[AsJSON data:statsByLevel1 /]
[/FlexBox]

# Level 2
[FlexBox]
[Chart type:"pie" data:statsByLevel2 colorScale:\`["green", "grey" ]\` /]
[AsJSON data:statsByLevel2 /]
[/FlexBox]

[/FlexBox]

[FlexBox]
# Level 3
[FlexBox]
[Chart type:"pie" data:statsByLevel3 colorScale:\`["green", "grey" ]\` /]
[AsJSON data:statsByLevel3 /]
[/FlexBox]

# Level 4
[FlexBox]
[Chart type:"pie" data:statsByLevel4 colorScale:\`["green", "grey" ]\` /]
[AsJSON data:statsByLevel4 /]
[/FlexBox]
[/FlexBox]
   `
  },
  {
    id: "D5a1DVMw7FV",
    name: "List data elements that aren't linked to program stages or datasets",
    editable: true,
    code: `
    const api = await dhis2.api();
    const de = await api.get("dataElements", {
    fields: "id,name,href,domainType",
    filter: "dataSetElements:empty",
    paging: false
    });


    const programResp = await api.get("programStages", {
        fields: "programStageDataElements[dataElement[id]]",
        paging: false
    })

    const usedByPrograms = new Set(programResp.programStages.flatMap(ps=> ps.programStageDataElements.map(psde => psde.dataElement.id)))

    return de.dataElements.filter( de => !usedByPrograms.has(de.id))
`
  },

  {
    id: "YuQRTavdpGE",
    name: "Show orgunits with a level 2 org unit on map",
    editable: true,
    code: `
    const api = await dhis2.api();
const parent = await api.get("organisationUnits", {
  fields: "id,name,coordinates,geometry",
  filter: "level:eq:2",
  pageSize: 2
});
const ou = await api.get("organisationUnits", {
  fields: "id,name,coordinates,featureType,geometry,path",
  filter: "path:ilike:" + parent.organisationUnits[0].id,
  paging: false
});
return ou.organisationUnits;
`
  },
  {
    id: "a0d79dd5c59",
    name: "Play - display events and map",
    editable: true,
    code: `
      const api = await dhis2.api();

      const ev = await api.get("events", {
        program: "VBqh0ynB2wv",
        pageSize: 100
      });

      return ev.events;

        `
  },
  {
    id: "af2fd38f351",
    name: "Play - Periods",
    editable: true,
    code: `
const periods = ["2019", "2019S1", "2019Q3", "201907"];
const frequencies = [
  "monthly",
  "quarterly",
  "yearly",
  "sixMonthly",
  "financialJuly"
];
const results = [];
periods.forEach(period => {
  frequencies.forEach(frequency => {
    results.push(
      [period, frequency].concat(DatePeriods.split(period, frequency))
    );
  });
});

return results;

    `
  },
  {
    id: "af2fd38f350",
    name: "Play - display event values and map",
    editable: true,
    code: `
      const api = await dhis2.api();
      const de = await api.get("dataElements", {
        fields: "id,name",
        filter: "domainType:eq:TRACKER",
        paging: false
      });
      const dataElementsById = {};
      de.dataElements.forEach(de => (dataElementsById[de.id] = de.name));
      const ev = await api.get("events", {
        program: "VBqh0ynB2wv",
        pageSize: 100
      });
      const events = ev.events.map(event => {
        r = { id: event.event, coordinate: event.coordinate };

        event.dataValues.forEach(
          dataValue => (r[dataElementsById[dataValue.dataElement]] = dataValue.value)
        );

        r.color = r["Gender"] == "Male" ? "blue" : "red";
        return r;
      });

      return events;


        `
  },
  {
    id: "dy1a1mseGR7",
    name: "Play - indicators using a given data element",
    editable: true,
    code: `
    const api = await dhis2.api();
    const dataElementId = "fbfJHSPpUQD";
    const ind = await api.get("indicators", {
      filter: "numerator:token:" + dataElementId,
      fields:
        "id,name,numerator,denominator,numeratorDescription,denominatorDescription",
      paging: false
    });
    const ind2 = await api.get("indicators", {
      filter: "denominator:token:" + dataElementId,
      fields:
        "id,name,numerator,denominator,numeratorDescription,denominatorDescription",
      paging: false
    });
    return _.uniqBy(ind.indicators.concat(ind2.indicators), i => i.id);
    `
  },
  {
    id: "ToQVD4irW3Q",
    name: "Play - programIndicators using a given tracker data element",
    editable: true,
    code: `
    const api = await dhis2.api();
const dataElementId = "Zj7UnCAulEk";
const ind = await api.get("programIndicators", {
  filter: "expression:token:" + dataElementId,
  fields: "id,name,expression,filter,description",
  paging: false
});
const ind2 = await api.get("programIndicators", {
  filter: "filter:token:" + dataElementId,
  fields: "id,name,expression,filter,description",
  paging: false
});
return _.uniqBy(
  ind.programIndicators.concat(ind2.programIndicators),
  i => i.id
);

`
  },
  {
    id: "r6JQgt6y8Dn",
    name: "Play - fetch values for a period and display them on a map",
    editable: true,
    code: `

    const api = await dhis2.api();
    const de = await api.get("dataElements", {
      filter: "dataElementGroups.id:eq:qfxEYY9xAl6",
      paging: false
    });
    const ou = await api.get("organisationUnits", {
      paging: false,
      fields: "id,name,geometry,coordinates"
    });
    const dataElementsById = _.keyBy(de.dataElements, de => de.id);
    const organisationUnitsById = _.keyBy(ou.organisationUnits, ou => ou.id);
    const dv = await api.get("dataValueSets", {
      orgUnit: "ImspTQPwCqd",
      children: true,
      dataElementGroup: "qfxEYY9xAl6",
      period: "201905"
    });
    dv.dataValues.forEach(dv => {
      dv.dataElement = dataElementsById[dv.dataElement];
      dv.orgUnit = organisationUnitsById[dv.orgUnit];
      dv.geometry = organisationUnitsById[dv.orgUnit.id].geometry;
      dv.color = dv.value == 9 ? "blue" : "red";
    });
    return dv.dataValues;
    `
  },
  {
    id: "gbvX3pogf7p",
    name: "Generic - overview of category combos",
    editable: true,
    code: `

    // press crtl-r to run
const api = await dhis2.api();
const ccc = await api.get("categoryCombos", {
  fields: "id,name,categories[name,categoryOptions[name]]",
  paging: false
});
ccc.categoryCombos.forEach(cc => {
  cc.description = cc.categories
    .map(
      c => c.name + " [" + c.categoryOptions.map(o => o.name).join(", ") + "]"
    )
    .join(", ");
  delete cc.categories;
});
return ccc.categoryCombos;
`
  },
  {
    id: "turfds456az",
    name: "Turf - demo",
    editable: true,
    code: `
    var points = [
      turf.point([29.3599, -3.3614], { name: "Bujumbura, Burundi" }),
      turf.point([4.3517, 50.8503], { name: "Bruxelles, Belgium" }),
      turf.point([2.3522, 48.8566], { name: "Paris, France" }),
      turf.point([13.405, 52.52], { name: "Berlin, Germany" }),
      turf.point([15.2663, -4.4419], { name: "Kinshasa, DRC" }),
      turf.point([-14.4392276, 14.5001717], { name: "Senegal" }),
      turf.point([31.0335, -17.8252], { name: "Harare, Zimbabwe" }),
      turf.point([-5.8593, 43.3614], { name: "Asturias, Spain" }),
      turf.point([2.3912, 6.3703], { name: "Cotonou, Benin" }),
      turf.point([-77.0369, 38.9072], { name: "Washington DC, USA" }),
      turf.point([3.406448, 6.465422], { name: "Busuyi (Lagos, Nigeria)" })
    ];
    points.sort((p1, p2) => turf.distance(p1, p2));
    const polPoints = points
      .map(p => p.geometry.coordinates)
      .concat([points[0].geometry.coordinates]);
    var line = turf.lineString([[0, 10], [20, 20]]);
    var tin = turf.tin(turf.featureCollection(points), "z");
    return points.concat([line]).concat(tin["features"]);

`
  },
  {
    id: "Yf6UHoPkdS6",
    name: "Play : update legendset colors",
    editable: true,
    code: `
    const api = await dhis2.api();
    const lengendSetId = "Yf6UHoPkdS6";
    const dryRun = true;
    let legendSet = await api.get("legendSets/" + lengendSetId);
    const colors = {
      "30 - 40": "#d9f0az",
      "40 - 50": "#addd50",
      "50 - 60": "#41ab60"
    };

    Object.keys(colors).forEach(range => {
      const legend = legendSet.legends.find(l => l.displayName == range);
      legend.color = colors[range];
    });
    if (!dryRun) {
      await api.update("legendSets/" + lengendSetId, legendSet);
    }
    legendSet = await api.get("legendSets/" + lengendSetId, {
      fields: ":all"
    });
    return legendSet;

`
  },
  {
    id: "aze123PkdS6",
    name: "Play : export orgunits with parent and groups",
    editable: true,
    code: `
  const api = await dhis2.api();
const ou = await api.get("organisationUnits", {
  fields:
    "id,name,coordinates,featureType,parent,organisationUnitGroups[id,name,groupSets[id]]",
  paging: false
});
return ou.organisationUnits.map(ou => {
  return {
    id: ou.id,
    name: ou.name,
    coordinates: ou.coordinates,
    featureType: ou.featureType,
    parent: ou.parent ? ou.parent.id : undefined,
    groups: ou.organisationUnitGroups.map(g => g.name).join(", ")
  };
});
`
  },
  {
    id: "YlvBkdBjjVO",
    name: "Play : event counts",
    editable: true,
    code: `
    // press crtl-r to run
const api = await dhis2.api();
const pg = await api.get("programs", {
  fields: "id,name,programStages[id,name]",
  paging: false
});

const results = [];

await asyncForEach(pg.programs, async program => {
  try {
    const ev = await api.get("events", {
      program: program.id,
      pageSize: 10,
      totalPages: true
    });
    results.push({
      id: program.id,

      name: program.name,
      events: ev.pager.total
    });
  } catch (ignore) {}
});

results.push({
  name: "TOTAL",
  events: results.map(m => m.events).reduce((a, b) => a + b)
});
return results;
`
  },
  {
    id: "YlvBkdBjaz5",
    name: "Play : CSV and fuse",
    editable: true,
    code: `

      const data = \`
line,name
1,Adonkiia
2,Afro Arabe Clinique
      \`;

      const options = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ["name"]
      };

      const api = await dhis2.api();
      const ou = await api.get("organisationUnits", {
        paging: false,
        fields: "id,name"
      });

      const fuse = new Fuse(ou.organisationUnits, options); // "list" is the item array

      let ouToMaps = PapaParse.parse(data.trim(), {
        header: true
      });

      ouToMaps.data.forEach(ouToMap => {
        ouToMap.mapping = fuse.search(ouToMap.name)[0];
      });

      return _.flattenObjects(ouToMaps.data);


    `
  },
  {
    id: "UMHyEfFHCcr",
    name: "Create event based on csv",
    editable: true,
    params: [
      {
        id: "program",
        label: "Search",
        type: "dhis2",
        resourceName: "programs",
        default: "lxAQ7Zs9VYR"
      },
      {
        id: "mode",
        label: "Select run mode",
        type: "select",
        default: "generateEmptyCsv",
        choices: [
          ["generateEmptyCsv", "Generate an empty csv"],
          ["dryRun", "Import from csv - Dry run"],
          ["import", "Import from csv - import events"]
        ]
      },
      {
        id: "file",
        label: "Pick csv with event values",
        type: "csv",
        helperText:
          "you can use 'Generate an empty csv' run mode to generate a template"
      }
    ],
    code: `

    const programId = parameters.program.id;

    const dryRun = parameters.mode =="dryRun";
    // press crtl-r to run
    const api = await dhis2.api();
    const pg = await api.get("programs/" + programId, {
      fields:
        "id,name,programStages[programStageDataElements[dataElement[id,name,valueType]]]"
    });
    const dataElementsByName = {};
    pg.programStages
      .flatMap(ps => ps.programStageDataElements)
      .map(psde => psde.dataElement)
      .forEach(de => (dataElementsByName[de.name] = de));

    if (parameters.mode == "generateEmptyCsv") {
      const result = {
        id: "orgUnitId",
        eventid:
          "pre-generated event Id by https://play.dhis2.org/2.29/api/system/id?limit=3"
      };
      Object.keys(dataElementsByName).forEach(k => {
        result[k] = "";
      });
      return [result];
    }

    const csv = parameters.file

    function formatValue(value, de) {
      if (de.valueType == "INTEGER_ZERO_OR_POSITIVE") {
        return parseInt(value);
      }
      if (de.valueType == "BOOLEAN") {
        return value === "Oui" || value === "1" ? true : false;
      }
      return value;
    }

    const events = csv.data.map(row => {
      return {
        program: programId,
        event: row.eventid,
        orgUnit: row.id,
        eventDate: "2019-11-18T00:00:00.000",
        status: "COMPLETED",
        dataValues: Object.keys(dataElementsByName).map(column => {
          return {
            dataElement: dataElementsByName[column].id,
            value: formatValue(row[column], dataElementsByName[column])
          };
        })
      };
    });

    if (dryRun) {
      return { events };
    } else {
      try {
        const createResp = await api.post("events", { events });
        return createResp;
      } catch (except) {
        return except;
      }
    }

    `
  },
  {
    id: "UMHyEfFHXLS",
    name: "XlsxPopulate - Create a workbook from js",
    editable: true,
    code: `

    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);

    sheet
      .cell("A1")
      .value("This was created in the browser!")
      .style("fontColor", "ff0000");

    const api = await dhis2.api();
    const ou = await api.get("organisationUnits", {
      fields: "id,name,ancestors[id,name]"
    });
    const r = sheet.cell("A2");
    r.value(ou.organisationUnits.map(ou => [ou.id, ou.name]));
    sheet.column("A").width(15);
    sheet.column("B").width(30);
    XlsxPopulate.openAsBlob(workbook, "orgunits.xslx");
    return "a workbook will open shortly";
    `
  },
  {
    id: "hV9ISZaPz2w",
    name: "Users - Create users from csv",
    editable: true,
    params: [
      {
          "id": "file",
          "type": "csv",
          "label": "Pick csv with event values"
      },
      {
          "id": "mode",
          "type": "select",
          "label": "Select run mode",
          "choices": [
              [
                  "dryRun",
                  "Import from csv - Dry run"
              ],
              [
                  "import",
                  "Import from csv - create users"
              ]
          ],
          "default": "dryRun"
      }
  ],
    code: `

const rawData = \`
firstName,surname,email,username,password,userRole,organisationUnits,dataViewOrganisationUnits
John,Doe,johndoe@mail.com,johndoe123,Your-password-123,Data entry clerk,DHIS2OUID,DHIS2OUID
\`;

const api = await dhis2.api();
const dryRun = parameters.mode == "dryRun";

const ur = await api.get("userRoles", { fields: "id,name", paging: false });
const userRoles = {};
ur.userRoles.forEach(u => (userRoles[u.name] = u.id));

const users = parameters.file.data.filter(user => user.username);

const ids = (await api.get("system/id?limit=" + 2 * users.length))["codes"];

let index = 0;
dhis2_users = users.map(user => {
  const id1 = ids[index];
  const id2 = ids[index + 1];
  index = index + 2;
  const dhis2user = {
    id: id1,
    firstName: user.firstName,
    surname: user.surname,
    email: user.email,
    userCredentials: {
      id: id2,
      userInfo: {
        id: id1
      },
      username: user.username,
      password: user.password
    },
    organisationUnits: user.organisationUnits.split(",").map(id => {
      return { id };
    }),
    dataViewOrganisationUnits: user.dataViewOrganisationUnits
      .split(",")
      .map(id => {
        return { id };
      })
  };
  dhis2user.userRoles = user.userRole.split(",").map(role => {
    if (userRoles[role] == undefined) {
      throw new Error(
        "userRole not found : '" +
          role +
          "' known roles : " +
          Object.keys(userRoles).join(" ,")
      );
    }
    return { id: userRoles[role] };
  });

  dhis2user.userCredentials.userRoles = dhis2user.userRoles;
  return dhis2user;
});
if (dryRun) {
  return { dhis2_users };
} else {
  const resp = await api.post("metadata", { users: dhis2_users });
  return resp;
}


    `
  },
  {
    id: "akBR3UIfpLB",
    name: "Play - Pameters show case",
    editable: true,
    params: [
      {
        id: "program",
        label: "Search for program",
        type: "dhis2",
        resourceName: "programs",
        default: "sample"
      },
      {
        id: "datalementTracker",
        label: "Search for tracker data element",
        type: "dhis2",
        resourceName: "dataElements",
        filter: "domainType:eq:TRACKER"
      },
      {
        id: "datalementAggregate",
        label: "Search for aggregate data element",
        type: "dhis2",
        resourceName: "dataElements",
        filter: "domainType:eq:AGGREGATE"
      },
      {
        id: "mode",
        label: "Select run mode",
        type: "select",
        default: "generateEmptyCsv",
        choices: [
          ["generateEmptyCsv", "Generate an empty csv"],
          ["dryRun", "Import from csv - Dry run"],
          ["import", "Import from csv - import events"]
        ]
      },
      {
        id: "file",
        label: "Pick csv with event values",
        type: "csv",
        helperText:
          "you can use 'Generate an empty csv' run mode to generate a template"
      }
    ],
    code: `
       return parameters
    `
  },
  {
    id: "q1bKZe58btE",
    name: "Play - Mix orgunits and gadm",
    params: [
      {
        id: "orgunit",
        type: "dhis2",
        label: "Search for a zone",
        filter: "level:in:[1,2,3]",
        default: {
          name: "Badjia",
          id: "YuQRtpLP10I"
        },
        resourceName: "organisationUnits"
      },
      {
        id: "gadm_level",
        label: "GADM level",
        type: "select",
        default: "1",
        choices: [[0, "0"], [1, "1"], [2, "2"], [3, "3"]]
      }
    ],
    code: `
    // press crtl-r to run
    const api = await dhis2.api();
    const ou = await api.get("organisationUnits/" + parameters.orgunit.id, {
      fields: "id,name,geometry"
    });
    ou.opacity = 0.7;
    ou.color = "red";
    ou.fillColor = "red";

    const s3_url = "https://geojson-countries.s3-eu-west-1.amazonaws.com/";
    const download = async file => {
      return fetch(s3_url + file).then(f => f.json());
    };
    const gadm = await download("gadm36_SLE_"+parameters.gadm_level+".shp.geojson");

    const results = [];

    gadm["features"].forEach((f, index) => {
      results.push(f);
      f.name = f.properties.NAME_2;
      f.color = "black";
    });
    results.push(ou);
    return results;

 `
  },
  {
    id: "dHC94p8sbdE",
    name: "update custom attributes of program indicator",
    params: [
      {
        id: "programIndicator",
        type: "dhis2",
        resourceName: "programIndicators"
      },
      {
        id: "alternateName-fr",
        type: "text"
      },
      {
        id: "position",
        type: "text"
      },
      {
        id: "iconName",
        type: "text"
      },
      {
        id: "mode",
        label: "Select run mode",
        type: "select",
        default: "dryRun",
        choices: [["dryRun", "Dry run"], ["update", "update"]]
      }
    ],
    code: `

const api = await dhis2.api();
const pi = await api.get(
  "programIndicators/" + parameters.programIndicator.id,
  {
    fields: ":all",
    paging: false
  }
);

const values = {
  "alternateName-fr": parameters["alternateName-fr"],
  position: parameters["position"],
  iconName: parameters["iconName"]
};

const customAttributes = (await api.get("attributes",
                            {
                              fields:"id,name",
                              filter: "programIndicatorAttribute:eq:true"
                            })).attributes
if (customAttributes.length == 0) {
  alert("Sorry no custom attributes : "+Object.keys(values))
  return
}
customAttributes.forEach(customAttribute => {
  const currentVal = pi.attributeValues.find(
    attribValue => attribValue.attribute.id == customAttribute.id
  );
  const newValue = values[customAttribute.name];
  if (values[customAttribute.name]) {
    if (currentVal) {
      currentVal.value = newValue;
    } else {
      pi.attributeValues.push({
        value: newValue,
        attribute: { id: customAttribute.id }
      });
    }
  }
});

const dryRun = parameters.mode == "dryRun";
if (dryRun) {
  return pi;
} else {
  const updated = await api.update("programIndicators/" + pi.id, pi);
  return updated;
}
return pi.attributeValues;


`
  },
  {
    id: "YKPWywkbphl",
    name: "XLSForm - Generate a basic xlsform for a program",
    params: [
      {
        id: "program",
        type: "dhis2",
        resourceName: "programs"
      }
    ],
    code: `
    // press crtl-r to run

const api = await dhis2.api();
const pg = await api.get("programs/" + parameters.program.id, {
  fields:
    "id,name,programStages[programStageDataElements[compulsory,code,dataElement[id,name,formName,shortName,code,valueType,optionSet[id,code,name,options[code,name]]]]]",
  paging: false
});

function slugify(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz______'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
  .replace(/\\\s+/g, '_') // Replace spaces with -
  .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
  .replace(/&/g, '_and_') // Replace & with 'and'
  .replace(/[^[a-zA-Z0-9أ-ي]-]+/g, "") // Arabic support
  .replace(/__+/g, '_') // Replace multiple - with single -
  .replace(/^-+/, '') // Trim - from start of text
  .replace(/_+$/, '') // Trim - from end of text
  }

const workbook = await XlsxPopulate.fromBlankAsync();
const sheet = workbook.sheet(0);
const questions = [
  [
    "type",
    "name",
    "label",
    "required",
    "choice_filter",
    "constraint",
    "constraint_message",
    "relevant",
    "hint",
    "appearance",
    "calculation"
  ]
];


pg.programStages.forEach(programStage => {
  programStage.programStageDataElements.forEach(de => {
    let type = "";
    let constraint = undefined;
    let constraint_message = undefined
    let required = undefined
    if (de.compulsory == true){
      required = "true"
    }
    if (de.dataElement.optionSet) {
      type = "select_one " + slugify(de.dataElement.optionSet.code || de.dataElement.optionSet.name);
    } else if (de.dataElement.valueType == "BOOLEAN" || de.dataElement.valueType == "TRUE_ONLY") {
      type = "select_one yesno";
    } else if (de.dataElement.valueType == "DATE") {
      type = "date";
    } else if (de.dataElement.valueType == "TEXT") {
      type = "text";
    } else if (de.dataElement.valueType == "PERCENTAGE") {
      type = "integer";
    } else if (de.dataElement.valueType == "INTEGER") {
      type = "integer";
    } else if (de.dataElement.valueType == "INTEGER_POSITIVE"){
      type = "integer";
      constraint = ". > 0";
      constraint_message = "must be non-zero positive number"
    } else if (de.dataElement.valueType == "INTEGER_ZERO_OR_POSITIVE"){
      type = "integer";
      constraint = ". >= 0";
      constraint_message = "must be a positive number"
    } else if (de.dataElement.valueType == "INTEGER_ZERO_OR_NEGATIVE"){
      type = "integer";
      constraint = ". <= 0";
      constraint_message = "must be a negative number"
    } else if (de.dataElement.valueType == "INTEGER_NEGATIVE"){
      type = "integer";
      constraint = ". < 0";
      constraint_message = "must be non-zero negative number"
    } else if (de.dataElement.valueType == "NUMBER") {
      type = "decimal";
    } else if ( de.dataElement.valueType == "COORDINATE") {
      type = "geopoint"
    }
    questions.push([type, de.dataElement.code, de.dataElement.formName || de.dataElement.name, required, undefined, constraint, constraint_message]);
  });
})
questions.push(["image", "imgUrl", "Photo de la structure"]);
questions.push(["geopoint", "gps", "Coordonnées GPS"]);

sheet.name("survey");
sheet.cell("A1").value(questions);

const sheetChoices = workbook.addSheet("choices");
const dataElementsWithOptionSets = pg.programStages[0].programStageDataElements.filter(
  de => de.dataElement.optionSet
);
const optionChoices = [
  ["list_name", "name", "label"],
  ["yesno", "yes", "1"],
  ["yesno", "no", "0"]
];
dataElementsWithOptionSets.forEach(de => {
  de.dataElement.optionSet.options.forEach(option => {
    optionChoices.push([
      slugify(de.dataElement.optionSet.code || de.dataElement.optionSet.name),
      option.code,
      option.name
    ]);
  });
});

const sheetSettings = workbook.addSheet("settings");
const settings = [
  ["form_title","form_id"],
  [pg.name,pg.code]
];
sheetSettings.cell("A1").value(settings);

sheetChoices.cell("A1").value(optionChoices);

XlsxPopulate.openAsBlob(workbook, "orgunits.xslx");

return pg;
`
  },
  {
    id: "vPHBZOSHMfS",
    name: "XLSForm - Diff two xlsform",
    params: [
      {
        id: "v1",
        type: "xlsx"
      },
      {
        id: "v2",
        type: "xlsx"
      }
    ],
    code: `
const surveyV1 = parameters.v1.sheet("survey");
const surveyV2 = parameters.v2.sheet("survey");

const questionKeysFrom = survey => {
  return survey
    .range("B2:B2000")
    .value()
    .flat(1)
    .filter(v => v != null);
};

const questionFields = [
  "type",
  "name",
  "label",
  "constraint",
  "constraint_message",
  "relevant",
  "choice_filter",
  "required",
  "hint",
  "appearance",
  "calculation"
];
const asQuestions = survey => {
  const questions = survey
    .range("A2:K2000")
    .value()
    .map(row => {
      const val = {};
      questionFields.forEach((col, index) => {
        let rawVal = row[index];
        if (rawVal && rawVal["_node"]) {
          rawVal = rawVal["_node"]["children"];
        }
        val[col] = rawVal;
      });
      return val;
    });
  results = {};
  questions.forEach(q => (results[q.name] = q));
  return results;
};

const v1_question_keys = new Set(questionKeysFrom(surveyV1));

const v2_question_keys = new Set(questionKeysFrom(surveyV2));

let allKeys = new Set([...v1_question_keys, ...v2_question_keys]);

let same_keys = new Set(
  [...v1_question_keys].filter(x => v2_question_keys.has(x))
);

let deleted_keys = new Set(
  [...v1_question_keys].filter(x => !v2_question_keys.has(x))
);
let added_keys = new Set(
  [...v2_question_keys].filter(x => !v1_question_keys.has(x))
);

questions_v1 = asQuestions(surveyV1);

questions_v2 = asQuestions(surveyV2);
diffs = [];
same_keys.forEach(key => {
  const q1 = questions_v1[key];
  const q2 = questions_v2[key];
  const diffColumns = questionFields.filter(
    field =>
      (q1 == undefined && q2 != undefined) ||
      (q1 != undefined && q2 == undefined) ||
      (q1 && q2 && q1[field] !== q2[field])
  );
  if (diffColumns.length > 0) {
    diffs.push({ key, diffColumns, v1: q1, v2: q2 });
  }
});
const flattened_diff = diffs.map(d => {
  let v = { key: d.key, status: "M", diffColumns: d.diffColumns.join(" , ") };
  d.diffColumns.forEach(c => {
    v[c + "_v1"] = d.v1[c];
    v[c + "_v2"] = d.v2[c];
  });

  return v;
});

added_keys.forEach(added_key => {
  const q = questions_v2[added_key];
  let v = {
    key: added_key,
    status: "A",
    diffColumns: ":ALL"
  };
  questionFields.forEach(c => {
    v[c + "_v2"] = q[c];
  });
  flattened_diff.push(v);
});

deleted_keys.forEach(deleted_key => {
  const q = questions_v1[deleted_key];
  let v = {
    key: deleted_key,
    status: "D",
    diffColumns: ":ALL"
  };
  questionFields.forEach(c => {
    v[c + "_v1"] = q[c];
  });
  flattened_diff.push(v);
});

return flattened_diff;
return {
  deleted_keys: Array.from(deleted_keys),
  added_keys: Array.from(added_keys),
  same_keys: Array.from(same_keys),
  allKeys: Array.from(allKeys),
  v1_question_keys: Array.from(v1_question_keys),
  v2_question_keys: Array.from(v2_question_keys),
  diffs: diffs
};

`
  },
  {
    id: "WJBsaMBdioj",
    name: "XLSForm - generate a xlsform from a DataSet",
    params: [
      {
        id: "dataSet",
        type: "dhis2",
        resourceName: "dataSets"
      }
    ],
    code: `const api = await dhis2.api();

    //return await api.get("dataSets");
    const ds = await api.get("dataSets/" + parameters.dataSet.id, {
      fields:
        "id,name,periodType,dataSetElements[dataElement[id,name,formName,code,valueType,categoryCombo[id,name,categoryOptionCombos[id,name,categoryOptions[id,name,code]]]"
    });
    const questions = [];

    var collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base"
    });
    const dataSetElements = ds.dataSetElements.sort((a, b) =>
      collator.compare(a.dataElement.name, b.dataElement.name)
    );

    function slugify(str) {
      str = str.replace(/^\s+|\s+$/g, ""); // trim
      str = str.toLowerCase();

      // remove accents, swap ñ for n, etc
      var from = "àáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
      var to = "aaaaaeeeeiiiioooouuuunc______";

      for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
      }

      str = str
        .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
        .replace(/\s+/g, "_") // collapse whitespace and replace by -
        .replace(/-+/g, "_"); // collapse dashes

      return str;
    }

    dataSetElements.forEach(dataSetElement => {
      const dataElement = dataSetElement.dataElement;
      dataElement.categoryCombo.categoryOptionCombos.forEach(coc => {
        const coc_code = coc.categoryOptions.map(o => slugify(o.code)).join("__");
        let type = "";
        let constraint;
        let constraint_message;
        let required;

        if (
          dataElement.valueType == "BOOLEAN" ||
          dataElement.valueType == "TRUE_ONLY"
        ) {
          type = "select_one yesno";
        } else if (dataElement.valueType == "DATE") {
          type = "date";
        } else if (dataElement.valueType == "TEXT") {
          type = "text";
        } else if (dataElement.valueType == "PERCENTAGE") {
          type = "integer";
        } else if (dataElement.valueType == "INTEGER") {
          type = "integer";
        } else if (dataElement.valueType == "INTEGER_POSITIVE") {
          type = "integer";
          constraint = ". > 0";
          constraint_message = "must be non-zero positive number";
        } else if (dataElement.valueType == "INTEGER_ZERO_OR_POSITIVE") {
          type = "integer";
          constraint = ". >= 0";
          constraint_message = "must be a positive number";
        } else if (dataElement.valueType == "INTEGER_ZERO_OR_NEGATIVE") {
          type = "integer";
          constraint = ". <= 0";
          constraint_message = "must be a negative number";
        } else if (dataElement.valueType == "INTEGER_NEGATIVE") {
          type = "integer";
          constraint = ". < 0";
          constraint_message = "must be non-zero negative number";
        } else if (dataElement.valueType == "NUMBER") {
          type = "decimal";
        } else if (dataElement.valueType == "COORDINATE") {
          type = "geopoint";
        }
        let label = dataElement.formName || dataElement.name;
        let code = slugify(dataElement.code || dataElement.name);
        if (coc.name != "default") {
          label = label + " " + coc.name;
          code = code + "__" + coc_code;
        }
        questions.push({
          type: type,
          name: code,
          label: label,
          constraint: constraint,
          constraint_message: constraint_message
        });
      });

      //questions.push({});
    });

    const workbook = await XlsxPopulate.fromBlankAsync();

    const questionFields = [
      "type",
      "name",
      "label",
      "constraint",
      "constraint_message",
      "relevant",
      "choice_filter",
      "required",
      "hint",
      "appearance",
      "calculation"
    ];

    const sheet = workbook.sheet(0);
    sheet.name("survey");
    sheet.cell("A1").value([questionFields])
    sheet.cell("A2").value(questions.map(question => questionFields.map(f => question[f])));


    const sheetChoices = workbook.addSheet("choices");
    const optionChoices = [
      ["list_name", "name", "label"],
      ["yesno", "yes", "1"],
      ["yesno", "no", "0"]
    ];
    sheetChoices.cell("A1").value(optionChoices);

    const sheetSettings = workbook.addSheet("settings");
    const settings = [
      ["form_title","form_id"],
      [ds.name,ds.code]
    ];

    sheetSettings.cell("A1").value(settings);

    XlsxPopulate.openAsBlob(workbook, slugify(ds.name)+".xslx");


    return questions;
    `
  },
  {
    id: "ZZJcZFTSl50",
    name: "Coordinates coverage",
    code: `
let stats = [];
const api = await dhis2.api();

const levels = (await api.get("organisationUnitLevels", {
  fields: "id,name,level",
  order: "level"
})).organisationUnitLevels;

function perc2color(perc) {
  var r,
    g,
    b = 0;
  if (perc < 50) {
    r = 255;
    g = Math.round(5.1 * perc);
  } else {
    g = 255;
    r = Math.round(510 - 5.1 * perc);
  }
  var h = r * 0x10000 + g * 0x100 + b * 0x1;
  return "#" + ("000000" + h.toString(16)).slice(-6);
}
const system = await api.get("system/info");
const version = system.version;
const v = version.split(".");
const vfloat = parseFloat(v[0] + "." + v[1]);
const fieldCoordinates = vfloat >= 2.32 ? "geometry" : "coordinates";
const ouFields = "id,name,coordinates,geometry,ancestors[id,name],leaf,level"
let provinces = await api.get("organisationUnits", {
  fields: ouFields,
  filter: ["level:eq:2"],
  paging: false
});
let allOrgunits = [];
const facilityLevel = levels[levels.length - 1];
for (province of provinces.organisationUnits) {
  const children = await api.get("organisationUnits", {
    fields: ouFields,
    filter: ["path:ilike:" + province.id],
    paging: false
  });
  withCoordinates = children.organisationUnits.filter(
    ou => ou.level == facilityLevel.level && (ou.coordinates || ou.geometry)
  ).length;
  withoutCoordinates = children.organisationUnits.filter(
    ou =>
      facilityLevel.level &&
      (ou.coordinates == undefined && ou.geometry == undefined)
  ).length;
  province.withCoordinates = withCoordinates;
  province.withoutCoordinates = withoutCoordinates;
  province.totalFacilities = withCoordinates + withoutCoordinates
  province.percentage =
    ((withCoordinates * 100) / (withCoordinates + withoutCoordinates)).toFixed(2);
  province.color = "blue";
  province.fillColor = perc2color(province.percentage);
  stats.push(province);
  children.organisationUnits.forEach(ou => allOrgunits.push(ou));
}
report.register("organisationUnits", allOrgunits);
report.register("stats2", stats);
stats = []
allOrgunits.forEach(ou => turf.geometrify(ou))
const districts = allOrgunits.filter(ou => ou.level == 3)
const badPoints = []
for (district of districts ) {
  children = allOrgunits.filter(ou => ou.level == facilityLevel.level && ou.ancestors[2] && ou.ancestors[2].id == district.id)
  withCoordinates = children.filter(
    ou => (ou.coordinates || ou.geometry)
  ).length;
  withoutCoordinates = children.filter(
    ou =>
      (ou.coordinates == undefined && ou.geometry == undefined)
  ).length;
  children.filter(ou => ou.geometry).forEach( ou => {
    ou.inside = turf.booleanPointInPolygon(ou.geometry, district.geometry);
    ou.color = ou.inside ? "green" : "red"
    if (ou.inside == false) {
      badPoints.push(ou)
    }
  })

  district.pointsInParentPolygon = children.filter(ou => ou.inside == true).length
  district.withCoordinates = withCoordinates;
  district.withoutCoordinates = withoutCoordinates;
  district.totalFacilities = withCoordinates + withoutCoordinates
  district.percentage =
    ((withCoordinates * 100) / (withCoordinates + withoutCoordinates)).toFixed(2);


  district.color = "blue";
  district.fillColor = perc2color(district.percentage);
  stats.push(district);
}

report.register("stats3", stats);
report.register("stats4", stats.concat(badPoints));
return "";
  `,
    report: `
[PageOrientation orientation:"landscape" /]
# Coordinates Coverage

> Number of org units with coordinates
> --------------------------------------------------------------------
>                 Number of org units

[PageBreak /]
## At level 2
[FlexBox]
[OrgunitMap lines:stats2 /]
[/FlexBox]
[PageBreak /]

## At level 3
[FlexBox]
[OrgunitMap lines:stats3 /]
[/FlexBox]
[PageBreak /]


## Detailed data
[DataTable data:\`stats2.map(l => _.omit(l, ['id','geometry','coordinates','ancestors','color','fillColor']))\` label:"Province coverage data" perPage:20/]

[br/][br/][br/]
[DataTable data:\`stats3.map(l => _.omit(l, ['id','geometry','coordinates','ancestors','color','fillColor']))\` label:"District coverage data" perPage:5/]

# Coordinates not belonging to parent polygon

## All points
[FlexBox]
[OrgunitMap lines:organisationUnits width:"700px" height:"700px"/]
[/FlexBox]
[PageBreak /]

## All points not belonging to parent polygon
[FlexBox]
[OrgunitMap lines:\`stats4.map(l => _.omit(l, ['color','fillColor']))\` width:"700px" height:"700px"/]
[/FlexBox]
`
  },
  {
    id: "FP8cYl1lSF6",
    name: "demo dashboard to pdf",
    params: [
      {
        id: "dashboard",
        label: "Search",
        type: "dhis2",
        resourceName: "dashboards",
        default: {
          name: "PLAY Delivery",
          id: "iMnYyBfSxmM"
        }
      }
    ],
    code: `
    let params = new URLSearchParams(window.location.href.split("?")[1]);
    const dashboardId = params.get("dashboardId") || parameters.dashboard.id
// press crtl-r to run
const api = await dhis2.api();
const ou = await api.get("dashboards/"+dashboardId, {
  fields: "id,name,dashboardItems[type,chart[id,name],map[id,name],reportTable[id,name]]",
  paging: false
});
const vals = ou.dashboardItems.filter(d => d.chart || d.map|| d.reportTable);

report.register("charts", vals);
return "";
`,

    report: `
[PageOrientation orientation:"landscape" /]


[MyLoop value:charts]
 [Dhis2Item /]
 [PageBreak /]
[/MyLoop]`
  },
  {
    id: "azwst23HaO2",
    name: "demo dashboard to pdf 2",
    params: [
      {
        id: "dashboard",
        label: "Search",
        type: "dhis2",
        resourceName: "dashboards",
        default: {
          name: "PLAY Delivery",
          id: "iMnYyBfSxmM"
        }
      }
    ],
    code: `
    let params = new URLSearchParams(window.location.href.split("?")[1]);
    const dashboardId = params.get("dashboardId") || parameters.dashboard.id
    const api = await dhis2.api();

    const toDataURL = url =>
      fetch(url)
        .then(response => response.blob())
        .then(
          blob =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );

    const ou = await api.get("dashboards/" + dashboardId, {
      fields:
        "id,name,dashboardItems[type,chart[id,name],map[id,name],reportTable[id,name]]",
      paging: false
    });
    const dashboardItems = ou.dashboardItems.filter(
      d => d.chart || d.map || d.reportTable
    );

    const results = [];
    for (item of dashboardItems) {
      const prefixUrl = "../../";
      const propName =
        item && item.type
          ? item.type == "REPORT_TABLE"
            ? "reportTable"
            : item.type.toLowerCase()
          : "";

      const itemName = item && item[propName] ? item[propName].name : "";
      let resourceName = undefined;
      if (propName == "reportTable") {
        resourceName = "reportTables";
      } else {
        resourceName = propName.toLowerCase() + "s";
      }
      let url = prefixUrl + resourceName + "/" + item[propName].id + "/data";
      let content = undefined;
      let contentType
      if (propName == "reportTable") {
        url += ".html+css";
        contentType = "html";
        content = await fetch(url).then(r => r.text());
      } else {
        url += ".png";
        contentType = "img";
        content = await toDataURL(url);
      }

      results.push({ item, url, content, contentType });
    }
    report.register("charts", results);
    return null;

`,

    report: `
[PageOrientation orientation:"landscape" /]


[MyLoop value:charts]
 [Dhis2Content /]
 [PageBreak /]
[/MyLoop]`
  },
  {
    id: "df",
    name: "Last metadata changes (this months max 1000)",
    code: `
date = new Date();
var newDate = new Date(date.setMonth(date.getMonth() - 1));
const api = await dhis2.api();
const ou = await api.get("metadataAudits", {
  pageSize: 1000,
  createdAt: date.toJSON().substring(0, 7)
});
ou.metadataAudits = ou.metadataAudits.sort(
  (a, b) => -1 * a.createdAt.localeCompare(b.createdAt)
);
const format_value = mutation => {
  if (mutation.path == "attributeValues") {
    return mutation.value
      .map(av => av.attribute.code + " => " + av.value)
      .join("\\n");
  }
  if (mutation.path == "dataSetElements") {
    return (
      mutation.path + " => " + mutation.value.map(av => av.dataElement.name)
    );
  }
  return mutation.path + " => " + mutation.value;
};

ou.metadataAudits.forEach(met => {
  met.klass = met.klass.split(".")[met.klass.split(".").length - 1];
  if (met.value) {
    const value = JSON.parse(met.value);
    let val = value.mutations
      ? value.mutations
          .filter(m => m.path !== "lastUpdated")
          .map(m => format_value(m))
      : [];
    if (met.type === "CREATE" || met.type === "DELETE") {
      val = [value.name + " (" + value.id + ")"];
    }
    delete met.value;
    met.what = val.join("\\n ");
  }
});
return ou.metadataAudits;
`
  },
  {
    id: "vgSvwOMNAvQ",
    name: "Data values for a given orgUnit, dataSet and periods",
    params: [
      {
        id: "dataSet",
        type: "dhis2",
        resourceName: "dataSets"
      },
      {
        id: "orgUnit",
        type: "dhis2",
        resourceName: "organisationUnits"
      },
      {
        id: "periods",
        type: "text"
      }
    ],
    code: `
    // #/recipes/VJSWf8Ktrao?dataSet=aLpVgfXiz0f&orgUnit=U514Dz4v9pv&periods=2018,2019&autorun=true
    let params = new URLSearchParams(window.location.href.split("?")[1]);
const periods = params.get("periods") || parameters.periods;
const dataSetId = params.get("dataSet") || parameters.dataSet.id;
const orgUnitId = params.get("orgUnit") || parameters.orgUnit.id;
const api = await dhis2.api();

const dataSet = await api.get("dataSets/" + dataSetId, {
  fields:
    "id,dataSetElements[dataElement[id,name,categoryCombo[id,name,categoryOptionCombos[id,name]"
});

const dataElementsById = {};

const categoryOptionCombosById = {};

dataSet.dataSetElements.forEach(dse => {
  const dataElement = dse.dataElement;
  dataElementsById[dataElement.id] = {
    id: dataElement.id,
    name: dataElement.name
  };
  const categoryOptionCombos = dataElement.categoryCombo.categoryOptionCombos;
  categoryOptionCombos.forEach(coc => (categoryOptionCombosById[coc.id] = coc));
});

const periodsQuery =
  "period=" +
  periods
    .split(",")
    .map(p => p.trim())
    .join("&period=");
const ouQuery = "orgUnit=" + orgUnitId;

const url =
  "dataValueSets?" + periodsQuery + "&" + ouQuery + "&dataSet=" + dataSetId;
const vals = await api.get(url);

if (!vals.dataValues) {
  return "no data";
}

vals.dataValues.forEach(dv => {
  dv.dataElement = dataElementsById[dv.dataElement];
  dv.categoryOptionCombo = categoryOptionCombosById[dv.categoryOptionCombo];
});

const values = _.flattenObjects(vals.dataValues);
const workbook = await XlsxPopulate.fromBlankAsync();
const columns = Object.keys(values[0]);

const sheet = workbook.sheet(0);
sheet
  .cell("A1")
  .value([columns])
  .style("fontColor", "ff0000");

const r = sheet.cell("A2");

r.value(values.map(dv => columns.map(col => dv[col])));
sheet.column("A").width(30);
sheet.column("B").width(30);
sheet.column("C").width(30);
sheet.column("D").width(30);
sheet.column("E").width(30);
sheet.column("F").width(30);
sheet.column("G").width(30);
sheet.column("H").width(30);

XlsxPopulate.openAsBlob(
  workbook,
  "datavalues-" + orgUnitId + "-" + dataSetId + "-" + periods + "" + ".xlsx"
);
return vals.dataValues;
`
  },

  {

      id: "azdflm3HaO2",
      name: "Play : Audit, select and fix orgunit name demo",
      report:`
# Hello

* Run once, select a few orgunits
* then click "Fix me"
* then confirm
* this will patch the orgunits name and
* relaunch the recipe

[DataTable data:organisationUnits label:"organisationUnits" perPage:20 selectableRows:"multiple" ]
[DataTableAction label:"Fix me" onClick:organisationUnitsOnClick/]
[DataTableAction label:"Unfix me" onClick:organisationUnitsOnClick/]
[/DataTable]

demo
      `,
    code:`

// press crtl-r to run
const api = await dhis2.api();

const ou = await api.get("organisationUnits", {
  fields: "id,name,coordinates,geometry",
  paging: false
});

report.register("organisationUnits", ou.organisationUnits);
report.register("organisationUnitsOnClick", async selectedRows => {
  const details = [];
  const confirm = prompt(
    "Please confirm you want to modify all " +
      selectedRows.length +
      " orgunits. (Can't be undone !!)",
    "Yes"
  );
  if (confirm == "Yes") {
    for (selected of selectedRows) {
      details.push(
        await api.patch("organisationUnits/" + selected.id, {
          name: selected.name + " (modified by this recipe)"
        })
      );
    }
    report.reset("run");
    // report.reset("clear");
  }
});

return "";
`
  }
];
export default recipes;
