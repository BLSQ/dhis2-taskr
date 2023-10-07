import { init, getInstance, getManifest } from "d2/lib/d2";

const ORGUNIT_FIELDS =
  "[id,name,ancestors[id,name],organisationUnitGroups[id,name,code]]";

class Dhis2 {
  /**
   * @param url API endpoint url
   * @param auth Authentication HTTP header content
   */
  constructor(argOptions) {
    const options = argOptions || {};
    this.url = options.url || process.env.REACT_APP_DHIS2_URL || process.env.DHIS2_URL;
    this.user = options.user || process.env.REACT_APP_USER || process.env.DHIS2_USER
    this.password = options.password || process.env.REACT_APP_PASSWORD || process.env.DHIS2_PASSWORD;
    this.contractGroupId =
      options.contractGroupId || process.env.REACT_APP_CONTRACT_OU_GROUP;
    this.cache = [];
    this.userId = "";
    this.baseUrl = "..";
    this.ignoredStores = [""];
    this.version = "";
    this.forceHttps = options.forceHttps;
    if (options.disableInitialize) {
      return;
    }

    this.initialize = this.initialize();
  }

  /**
   * Initialized the Api to a d2 instance.
   * @returns {Api}
   */
  initialize() {
    let headers =
      process.env.NODE_ENV === "development"
        ? {
            Authorization: "Basic " + btoa(this.user + ":" + this.password)
          }
        : null;
    console.info("Using node env: " + process.env.NODE_ENV, this.url);
    this.d2 = getManifest("./manifest.webapp")
      .then(manifest => {
        let baseUrl =
          process.env.NODE_ENV === "production"
            ? manifest.getBaseUrl()
            : this.url;
        if (this.forceHttps) {
          baseUrl = baseUrl.replace("http://", "https://");
        }

        console.info("Using URL: " + baseUrl);
        this.baseUrl = baseUrl;
        return baseUrl + "/api";
      })
      .catch(e => {
        return this.url;
      })
      .then(baseUrl =>
        init({ baseUrl, headers }).then(d2 => {
          this.user = d2.currentUser;
          this.userId = d2.currentUser.id;
        })
      );
    return this;
  }

  appVersion() {
    return getManifest("./manifest.webapp").then(manifest => {
      return manifest.version;
    });
  }
  currentUser() {
    return getInstance().then(d2 => d2.currentUser);
  }

  systemInfoRaw() {
    return getInstance().then(d2 => d2.system.systemInfo);
  }

  currentUserRaw() {
    return getInstance().then(d2 =>
      d2.Api.getApi().get(
        "/me?fields=:all,organisationUnits" +
          ORGUNIT_FIELDS +
          ",dataViewOrganisationUnits" +
          ORGUNIT_FIELDS
      )
    );
  }
  organisationUnits(fields, page) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get(
        "/organisationUnits?fields=" + fields + "&pageSize=1000&page=" + page
      );
    });
  }

  api() {
    return getInstance().then(d2 => {
      return d2.Api.getApi();
    });
  }
  organisationUnitGroups(fields) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get(
        "/organisationUnitGroups?fields=" + fields + "&paging=" + false
      );
    });
  }

  findOrganisationUnit(id) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get("/organisationUnits/" + id);
    });
  }

  dataElements(query) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get(
        "/dataElements"+query
      );
    });
  }

  updateOrganisationUnit(ou) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().update(
        "/organisationUnits/" + ou.id + "?preHeatCache=false",
        ou
      );
    });
  }

  imgUrl() {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get("/attributes?filter=name:eq:imgUrl");
    });
  }

  addOrganisationUnitToGroup(ouId, groupId) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().post(
        "/organisationUnitGroups/" + groupId + "/organisationUnits/" + ouId
      );
    });
  }

  removeOrganisationUnitToGroup(ouId, groupId) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().delete(
        "/organisationUnitGroups/" + groupId + "/organisationUnits/" + ouId
      );
    });
  }

  findOrganisationUnitGroup(groupId) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().get("/organisationUnitGroups/" + groupId);
    });
  }

  updateOrganisationUnitGroup(group) {
    return getInstance().then(d2 => {
      return d2.Api.getApi().update(
        "/organisationUnitGroups/" + group.id,
        group
      );
    });
  }
}

export default Dhis2;
