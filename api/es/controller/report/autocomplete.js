const es = require("../../../../models/elasticsearch");
const { esFunc } = require("../../../../models/elasticsearch");
const {getSuggestion} = require("../terms/suggestion");


module.exports = async function (req, res) {
    const ss = req.query.ss;  //Search String
    const field  = req.query.field;
    const suggestBody = {
        query : {
            ss : ss , 
            field : "terms" 
        } , 
        params : {
            index : "my-terms"
        }
    }
    const suggestStr = await getSuggestion(suggestBody);
    let resData = [];
    for (let i = 0 ; i< suggestStr.length ; i++) {
        let body = await getAutoCompleteBody(field , suggestStr[i].text);
        let result = await getAutoCompleteResult (req , body);
        if (result.buckets.length > 0 ) {
            for (let value of result.buckets) {
                resData.push(value);
            }
        }
    }
    
    resData.sort((a, b) =>{
        if (a.doc_count > b.doc_count) {
            return -1
        } else if (a.doc_count < b.doc_count) {
            return 1;
        }
        return 0;
    });
    resData = resData.slice(0,10);
    if (resData.length ===0) {
        let body = await getAutoCompleteBody(field , ss);
        let result = await getAutoCompleteResult (req , body);
        if (result.buckets.length > 0 ) {
            for (let value of result.buckets) {
                resData.push(value);
            }
        }
    }
    res.send(resData);
}



async function getAutoCompleteBody (field ,  queryValue) {
    return new Promise ((resolve)=> {
        let body = {
            "size": 0 , 
            "query" : {
                "prefix": {
    
                }
            }
        };
        body["query"]["prefix"][`${field}.autocomplete`] = {
            "value": queryValue
        };
        body["aggs"] = {
            "my_unbiased_sample": {
                "sampler": {
                    "shard_size": 6000
                },
                "aggs": {
                    "autocomplete": {
                        "terms": {
                              "field": `${field}.autocomplete` , 
                              "include": `${queryValue}.*`  ,
                              "order": {
                                  "_count": "desc"
                              },
                        }
                    }
                }
            }
        }
        return resolve(body);
    });
}

async function getAutoCompleteResult (req, body) {
    return new Promise (async (resolve , reject)=> {
        let aggsObj = await es.getBasicDSLBody(req , body);
        let searchOption = {
    
        };
        try {
            const {body:  { aggregations : {my_unbiased_sample : {autocomplete} } } } = await es.esclient.search(aggsObj, searchOption);
            return resolve(autocomplete);
        } catch (e) {
            console.error(e);
            console.log(e.meta.body);
            if (e.meta.body.status === 400) {
                return resolve([]);
            } else {
                return reject(false);
            }
        }
    });
}