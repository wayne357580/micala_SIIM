const dicomjson = require('./dicom-tag');
const fs = require('fs');


let keys = Object.keys(dicomjson.dicomjson.dicom);
let dicomTag = {};

for (let i = 0 ; i < keys.length ; i++) {
    dicomTag[dicomjson.dicomjson.dicom[keys[i]]] = keys[i];
}
fs.writeFileSync('dicom2.json' , JSON.stringify(dicomTag));

