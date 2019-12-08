import XlsxPopulate from "xlsx-populate";

XlsxPopulate.openAsBlob = (workbook, filename) => {
  workbook.outputAsync({ type: "blob" }).then(function(blob) {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename || "out.xlsx");
    } else {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = filename || "out.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });
};

export default XlsxPopulate;
