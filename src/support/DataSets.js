class DataSets {
  constructor() {
    this.registeredCount = 0;
    this.datasets = {};
  }
  register(datasetName, data) {
    this.datasets[datasetName] = data;
    this.registeredCount += 1;
    return this;
  }
  reset(mode) {
    for (var member in this.datasets) {
      delete this.datasets[member];
    }
    this.registeredCount = 0;
    if (mode == "run" && this.reRun) {
      this.reRun();
    }
    if (mode == "clear" && this.clearResults) {
      this.clearResults();
    }
  }

  asVars() {
    return this.datasets;
  }
}

export default DataSets
