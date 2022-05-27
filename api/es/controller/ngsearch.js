const es = require("../../../models/elasticsearch");
const { esFunc } = require("../../../models/elasticsearch");

module.exports = async function (req, res) {
    const ss = req.query.ss;  //Search String
    const body = {
        "query": {
            "match": {
                "terms.ngram": ss
            }
        }
    }
    let searchObj = await esFunc.getBasicDSLBody(req, body);
    let searchOption = {

    };
    const { body: { hits } } = await es.esclient.search(searchObj, searchOption);
    console.log(hits);
    res.send(hits);
}