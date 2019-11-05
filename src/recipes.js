const recipes = [
  {
    id: "D5a1DVMw7FV",
    name: "empty",
    editable: true,
    code: `
    const api = await dhis2.api();
    const ou = await api.get("organisationUnits", {
      fields: "id,name,ancestors[id,name]"
    });
    
    return _.flattenObjects(ou.organisationUnits);     
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

const userResp = await api.get("users",{
    fields:"id,name,email,userCredentials[userRoles[id,name]],organisationUnits[id,name,level]",
    paging:false
})

return userResp.users.map( user => {
    return {
        id: user.id,
        name:user.name,
        email: user.email,
        superuser: user.userCredentials.userRoles.some(role => role["name"]==="Superuser") ? "super user !": "",
        manageOrganisationUnits: user.organisationUnits.map(ou=> ou.name).join(", ")
    }
}).sort((a,b) => a.superuser ? -1 : b.super_user ? -1: 1)

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
    });
    
    return stats;
    
    
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
  }
];
export default recipes;
