const es = require("../../../../models/elasticsearch");
const { esFunc } = require("../../../../models/elasticsearch");

module.exports = async function (req, res) {
    
    let resData = await getSuggestion(req);
    res.send(resData);
}



async function getSuggestion(req) {
    return new Promise (async (resolve , reject)=> {
        const ss = req.query.ss;  //Search String
        const field  = req.query.field;
        const body = {
            "suggest": {
                "my-suggest": {
                    "text": ss,
                    "completion": {
                        "field": `${field}.default`,
                        "size": 10,
                        "skip_duplicates": true
                    }
                }
            }
        }
        let aggsObj = await es.getBasicDSLBody(req , body)
        let searchOption = {
    
        };
        let {body:  { suggest } } = await es.esclient.search(aggsObj, searchOption);
        let result = suggest["my-suggest"][0]["options"];
        let fuzziness = 0;
        while (result.length === 0) {
            body["suggest"]["my-suggest"]["completion"]["fuzzy"] = {
                    "fuzziness" : fuzziness , 
                    "prefix_length" : 0
                }
            let {body:  { suggest } } = await es.esclient.search(aggsObj, searchOption);
            result = suggest["my-suggest"][0]["options"];
            fuzziness++;
            if (fuzziness >=6) {
                break;
            }
        }
        return resolve(result);
    });
}
module.exports.getSuggestion = getSuggestion;