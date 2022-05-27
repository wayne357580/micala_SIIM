const es = require("../../../../models/elasticsearch");
const { esFunc } = require("../../../../models/elasticsearch");

module.exports = async function (req, res) {
    const ss = req.query.ss;  //Search String
    const field  = req.query.field;
    const body = {
        "size": 0,
        "aggs": {
            "autocomplete": {
                "terms": {
                    "field": `${field}.autocomplete`,
                    "include": `${ss}.*`,
                    "order": {
                        "_count": "desc"
                    },
                    "size": 10
                }
            }
        }
    }
    let aggsObj = await es.getBasicDSLBody(req , body)
    let searchOption = {

    };
    const {body:  { aggregations : {autocomplete} } } = await es.esclient.search(aggsObj, searchOption);
    console.log(autocomplete);
    res.send(autocomplete);
}