import React from "react";

function Help() {
  return (
    <div
      style={{
        float: "right"
      }}
    >
      Help :{" "}
      <ul>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://docs.dhis2.org/master/en/developer/html/dhis2_developer_manual_full.html#webapi_metadata_object_filter"
          >
            Metadata object filter
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://gist.github.com/mestachs/e56a632a92a84148edda5678939626c5"
          >
            Some bluesquare recipes
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://lodash.com/docs/4.17.15"
          >
            lodash
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="http://turfjs.org/docs/"
          >
            turf
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.papaparse.com/"
          >
            Papa Parse
          </a>
        </li>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/dtjohnson/xlsx-populate#usage"
          >
            xlsx-populate
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Help;
