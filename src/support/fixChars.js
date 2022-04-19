const accents = {
  à: "00E0",
  À: "00C0",
  ç: "00E7",
  é: "00E9",
  É: "00C9",
  è: "00E8",
  È: "00C8",
  ê: "00EA",
  Ê: "00CA",
  ë: "00EB",
  Ë: "00CB",
  ô: "00F4",
  œ: "009C",
  ù: "00F9",
  ú: "00FA",
};

export const fixChars = (string) => {

    for( let accent of Object.keys(accents)) {
        string = string.split(accent).join("\\u"+accents[accent])
    }

    return string
};
