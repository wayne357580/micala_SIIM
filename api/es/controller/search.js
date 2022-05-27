const es = require("../../../models/elasticsearch");
const {esFunc} = require("../../../models/elasticsearch");
const _ = require('lodash');
const {momentDateFunc} =require('../../Api_function');
const {strToRegex} = require('../../Api_function');
const fs = require('fs');


const images = {
    search : async (req) => {
        return new Promise (async (resolve)=> {
            const imageReq = {
                query : req.query , 
                params : {
                    index : "my-testimagingstudy"
                }
            }
            const ss = req.query.ss;  //Search String
            let body = esFunc.searchMultiFields(ss, [ 
                "report.Records.FULLTEXT" ,
                "report.Records.FULLTEXT.autocomplete" ,
                "report.Records.FULLTEXT.edge_ngram" ,
                "series.instance.metadata*" ],  undefined , undefined , {
                "class" : "highlight" , 
                "field" : "report.Records.FULLTEXT" , 
                "option" : {
                    "number_of_fragments": 2,
                    "fragment_size": 50
                }
            });
            let doubleQuote = /"(.*?)"/g;
            let queryDoubleQuoteMatches = ss.matchAll(doubleQuote);
            
            for (let match of queryDoubleQuoteMatches) {
                let doubleQuoteMustQs = esFunc.searchMust(match[1] , [
                    "report.Records.FULLTEXT" ,
                    "report.Records.FULLTEXT.autocomplete" ,
                    "report.Records.FULLTEXT.edge_ngram" ,
                    "series.instance.metadata*"
                ]).query.bool.must;
                body.query.bool.must.push(...doubleQuoteMustQs);
            }
            console.log(body);
            const facetsCategoryAggs = esFunc.aggsFacetsNested( "category", "report.category" , "report.category.name.keyword" , 100);
            const facetsGenderAggs = esFunc.aggsTerms("gender" ,"dicomJson.00100040.Value.keyword"  , 100  , "UNKNOWN");
            
            body = _.assign(body, facetsCategoryAggs);
            body.aggs = _.assign(body.aggs , facetsGenderAggs.aggs);
            const facetFilters = req.body.filter;
            //左邊病徵agg勾選之filter
            for (let filterIndex in facetFilters) {
                let facetFilterItem = facetFilters[filterIndex];
                await facetFilter[facetFilterItem.field](body , facetFilterItem);
            }
            //qido filter
            let QIDOKey = _.pickBy(Object.keys(req.query) , v=> _.has(queryFilter ,v ));
            for (let k in QIDOKey) {
                let keyName =QIDOKey[k];
                let ESField = QIDOInES[keyName];
                QIDOquery[keyName](body , req.query[keyName] , ESField );
                console.log(ESField);
            }
            let searchObj = await esFunc.getBasicDSLBody(imageReq ,  body);
            console.log(JSON.stringify(searchObj.body , null , 4));
            let result = await es.esclient.search(searchObj, {}).catch((e)=>{
                console.dir(e);
            });
            let facetFiltersCategorise = _.filter(facetFilters , v=> v.field =="category");
            
            let agg = result.body.aggregations;
            for (let filterIndex in facetFiltersCategorise) {
                let facetFilterItem = facetFiltersCategorise[filterIndex];
                facetFilter.nested.refreshResult(agg , facetFilterItem.value);
            }
            
            _.set(agg , "gender.termAgg.buckets"  , agg.gender.buckets);
            _.unset(agg , "gender.buckets");
            let hits = result.body.hits.hits;
            let count  = result.body.hits.total.value;
            let imagingStudies = await Promise.all(_.map(hits , i => _.assign(i._source , {_score : i._score},{highlight : i.highlight} , {})
            ));;
            return resolve([imagingStudies , count ,agg]);
        });
    } , 
    getReport : async (req , imagings,iReports) => {
        for (let i = 0 ; i < iReports.length  ; i++) {
            await Promise.all(_.remove(imagings ,v=>v.identifier.some(x=> x.value == iReports[i].sID )));
        }
        for (let j  = 0 ; j < imagings.length ; j++) {
            const reportReq = {
                query : {
                    ss : ""
                } , 
                params : {
                    index : "my-report"
                }
            }
            const boolQuery = {
                "query" : {
                    "bool" : {
                        "should" : [

                        ]
                    }
                }
            }
            for (identifier of imagings[j].identifier) {
                const reportBody = esFunc.searchTerm("sID",identifier.value);
                boolQuery.query.bool.should.push(reportBody.query);
            }
            let reportObj = await esFunc.getBasicDSLBody(reportReq ,  boolQuery);
            let reportHits = await es.esclient.search(reportObj, {});
            reportHits = reportHits.body.hits.hits;
            reportHits = await Promise.all(_.map(reportHits , i => _.assign(i._source, {_score : i._score})));
            if (reportHits.length > 0) {
                reportHits[0].imagingstudy = imagings[j];
                reportHits[0]._score = imagings[j]._score;
            } else {
                reportHits = [];
                let pID = imagings[j].subject.reference.replace(/patient\//gi , "");
                reportHits[0] = {
                    pID : pID,
                    _score : imagings[j]._score,
                    imagingstudy : imagings[j]
                };
            }
            iReports.push(...reportHits);
        }
    }
}

const reports = {
    search : async (req) => {
        return new Promise(async (resolve)=> {
            const ss = req.query.ss;  //Search String
            const body = esFunc.searchAllFields(ss , undefined , undefined , {
                "class" : "highlight" , 
                "field" : "Records.FULLTEXT"
            });
            let searchObj = await esFunc.getBasicDSLBody(req ,  body);
            let searchOption = {
          
            };
            let result = await es.esclient.search(searchObj, searchOption);
            let hits = result.body.hits.hits;
            let count = result.body.hits.total.value;
            let report = await Promise.all(_.map(hits , i => 
                _.assign(i._source , {_score : i._score} ,{highlight : i.highlight} )));;
            return resolve([report , count]);
        });
    } , 
    getImage : async (req  , report) => {
        return new Promise (async (resolve)=> {
            let sID = report.sID;
            const imageReq = {
                query : {
                    ss : ""
                } , 
                params : {
                    index : "my-imagingstudy"
                }
            }
            const imageBody = esFunc.searchTerm("identifier.value",sID);
            let imageSearchObj = await esFunc.getBasicDSLBody(imageReq ,  imageBody);
            let imageHits = await es.esclient.search(imageSearchObj, {});
            imageHits = imageHits.body.hits.hits;
            imageHits = await Promise.all(_.map(imageHits , i => _.assign(i._source , {_score : i._score})));
            if (imageHits.length > 0) {
                report.imagingstudy = imageHits[0];
            }
            return resolve(report);
        });
    },

}

const patients = {
    getReport : async (req , report) => {
        return new Promise (async (resolve)=> {
            let pID = report.pID.replace("p","");
            const patientReq = {
                query : {
                    ss : ""
                } , 
                params : {
                    index : "my-patient"
                }
            }
            const patientBody = esFunc.searchTerm("id",pID.toLowerCase());
            let patientSearchObj = await esFunc.getBasicDSLBody(patientReq ,  patientBody);
            let patientHits = await es.esclient.search(patientSearchObj, {});
            patientHits = patientHits.body.hits.hits;
            patientHits = await Promise.all(_.map(patientHits , i => _.assign(i._source , {_score : i._score})));
            if (patientHits.length > 0) {
                patientHits[0].report = report
            }
            return resolve(patientHits[0]);
        });
    } ,
    getImagingStudy : async function (req ,imagingStudy) {
        return new Promise (async (resolve)=> {
            let pID = imagingStudy.subject.reference.replace(/patient\//gi,"");
            const patientReq = {
                query : {
                    ss : ""
                } , 
                params : {
                    index : "my-patient"
                }
            }
            const patientBody = esFunc.searchTerm("id",pID.toLowerCase());
            let patientSearchObj = await esFunc.getBasicDSLBody(patientReq ,  patientBody);
            let patientHits = await es.esclient.search(patientSearchObj, {});
            patientHits = patientHits.body.hits.hits;
            patientHits = await Promise.all(_.map(patientHits , i => _.assign(i._source , {_score : i._score})));
            if (patientHits.length > 0) {
                patientHits[0].imagingstudy = imagingStudy
            }
            return resolve(patientHits[0]);
        });
    }
}

const QIDOquery = {
    //imagingStudies
    StudyDate : (boolQuery , date , field) => {
        let dateCodition = esFunc.dateFunc.getDateCondition(date)
        let myDate = esFunc.dateFunc.getDateStr(date);
        let dateQuery = esFunc.dateFunc[dateCodition](myDate ,field);
        console.log(dateQuery);
        boolQuery.query.bool.must.push(dateQuery);
    },
    ModalitiesInStudy : (boolQuery , value) => {
        let query = esFunc.searchWildCard("series.modality.code" , value)
        boolQuery.query.bool.must.push(query.query);
    } , 
    PatientName : (boolQuery ,value) => {
       /* let familyName= esFunc.searchWildCard("dicomJson.00100010.Value.familyName" , `*${value}*`);
        let givenName = esFunc.searchWildCard("dicomJson.00100010.Value.givenName" , `*${value}*`);
        let middleName =esFunc.searchWildCard("dicomJson.00100010.Value.middleName" , `*${value}*`);
        let prefix = esFunc.searchWildCard("dicomJson.00100010.Value.prefix" , `*${value}*`);
        let suffix = esFunc.searchWildCard("dicomJson.00100010.Value.suffix" , `*${value}*`);
        let alphabetic = esFunc.searchWildCard("dicomJson.00100010.Value.Alphabetic" , `*${value}*`);*/
        let q = esFunc.queryStringMultiFields(["dicomJson.0010010*"] , value);
        boolQuery.query.bool.must.push(q.query);
    } ,
    PatientID : (boolQuery , value , field)  => {
        let query = esFunc.queryMatch(field , "match_phrase" , `patient/${value}`);
        boolQuery.query.bool.must.push(query.query);
    }
}

const queryFilter = {
    StudyDate : (date , value) => {
        let dateCodition = esFunc.dateFunc.getDateCondition(date)
        let myDate = esFunc.dateFunc.getDateStr(date);
        return momentDateFunc[dateCodition](value , ...myDate);
    } , 
    ModalitiesInStudy : (value , query) => {
        let regex = strToRegex(value);
        return _.some(query , v=> v.modality.code.match(regex));
    } , 
    PatientName : async (value , query) => {
        let regex = new RegExp(value , "gi");
        let isHave = await Promise.all(_.map(query , name => {
            return _.some(name , value => {
                return value.match(regex);
            })
        }));
        return isHave.some(x=> x);
    },
    PatientID : (value , query)=> {
        return value == query;
    },
    StudyInstanceUID : (value , query) => {
        let regex = strToRegex(value);
        return _.some(query , v=> v.value.match(regex));
    } , 
}

const QIDOInES = {
    StudyDate : "started" , 
    PatientID : "subject.reference" , 
    PatientName : "name"  ,
    ModalitiesInStudy :  "imagingstudy.series" ,
    StudyInstanceUID : "imagingstudy.identifier" , 
}

const facetFilter = { 
    nested : {
        checkIsNested : (filter) => {
            return !_.isUndefined(_.get(filter , "nested"))
        } , 
        addAggs : (queryBody , name) => {
            let topAgg = esFunc.aggsFacetsNested(name , "report.category" , "report.category.value.keyword", 100);
            let filterAgg = esFunc.aggsFilter("filterAgg","report.category.name.keyword" , name);
            _.set(filterAgg ,"aggs.filterAgg.aggs" ,topAgg.aggs[name].aggs);
            topAgg.aggs[name].aggs = filterAgg.aggs;
            _.set(queryBody.aggs , name , topAgg.aggs[name]);
        } ,
        refreshResult : (result , filterName) => {
            _.map(result.category.termAgg.buckets ,v=> {
                if (v.key == filterName) {
                    v.detection =result[filterName].filterAgg.termAgg.buckets
                }
            });
            _.unset(result , filterName);
        }
    } ,
    mergeFilterJson : {
        "undefined" : (body , filter) => {
            return _.set(body , "query.bool.filter" , filter ) ;
        } ,
        "object" : (body , filter) => {
            return body.query.bool.filter.push(filter[0]);
        }
    },
    "gender" : async (queryBody , item) => {
        let filter = {};
        let value = item.value;
        if (value == "UNKNOWN") {
            filter = esFunc.boolFilterMissing("dicomJson.00100040.Value").filter
        } else {
            filter = esFunc.boolFilterTerm("dicomJson.00100040.Value.keyword" , value).filter;
        }
        facetFilter.mergeFilterJson[typeof(queryBody.query.bool.filter)](queryBody , filter);
    } , 
    //過濾勾選之病徵
    "category" :async (queryBody , item) => {
        let value = item.value;
        let filter = esFunc.boolFilterNested("report.category" , "report.category.name" ,"match_phrase", value).filter;
        if (facetFilter.nested.checkIsNested(filter[0])) {
            console.log("is nested");
            facetFilter.nested.addAggs(queryBody , value);
        }
        facetFilter.mergeFilterJson[typeof(queryBody.query.bool.filter)](queryBody , filter);
    } ,
    //過濾 postive negative uncertain
    "detectionFilter" : (queryBody , item) => {
        let oriQuery= _.find(queryBody.query.bool.filter  , v => 
            _.get(v , "nested.query.bool.must")
            .find(v => _.get(v , "match_phrase['report.category.name']") == item.detectionField))
        let detectionFilter = esFunc.boolFilterTerms("report.category.value" , [item.value.toLowerCase()]).filter;
        oriQuery.nested.query.bool.must.push(detectionFilter[0]);
        //console.log(value);
    }
}

const profile = {
    "ALL" : async (searchResult) => {
        let allRadlexQs = [];
        for (let i = 0 ; i < searchResult.length ; i++) {
            let searchRadlex = {
                index: "my-testimagingstudy" ,
                body : {
                    query : {
                        bool : {
                            must : [
                                {
                                    term : {
                                        "id" : searchResult[i].id
                                    }
                                }
                            ]
                        }
                    } ,
                    aggs : {
                        radlexterm : {
                            terms : {
                                field : "report.Records.FULLTEXT.keep" ,
                                size : 1000
                            }
                        }
                    }
                }
            };
            let esSearch = await es.esclient.search(searchRadlex);
            let itemRadlex = esSearch.body.aggregations.radlexterm.buckets;
            let qs = {
                index: "my-testimagingstudy" ,
                body : {
                    query : {
                        bool : {
                            must : [
                                {
                                    term : {
                                        "id" : searchResult[i].id
                                    }
                                }
                            ] ,
                            should : []
                        }
                    } ,
                    highlight : {
                        type : "fvh" ,
                        pre_tags : ["<em>"] ,
                        post_tags : ["</em>"] ,
                        fields : {
                            "report.Records.FULLTEXT.forRadlex" : {
                                "number_of_fragments": 0
                            }
                        }
                    } 
                }
            }
            //console.log(itemRadlex);
            for (let radlex of itemRadlex) {
                    let radlexObj = await es.esclient.search({
                        index : "radlexterm" ,
                        body : {
                            query : {
                                term : {
                                    "Code Meaning.keyword" : radlex.key
                                }
                            }
                        }
                    });
                    radlexObj = radlexObj.body.hits.hits[0]._source;
                    let shingleLen = radlex.key.split(" ").length ;
                    let matchQs = {
                        "match" : {
                            "report.Records.FULLTEXT.forRadlex" : radlex.key
                        }
                    }
                    if (shingleLen > 1) {
                        matchQs = {
                            "match_phrase" : {
                                "report.Records.FULLTEXT.forRadlex" : {
                                    "query" : radlex.key 
                                }
                            }
                        }   
                    }
                    qs.body.query.bool.should.push(matchQs);
                    //在highlight加入radlex網址
                    let preTags = `<a href="http://radlex.org/RID/${radlexObj["Code Value"]}">`;
                    qs.body.highlight.pre_tags.push(preTags);
                    qs.body.highlight.post_tags.push("</a>");
                
                /*qs.body.query.bool.must.push({
                    "match" : {
                        "report.Records.FULLTEXT" : radlex
                    }
                });
                //在highlight加入radlex網址
                let preTags = `<a href="http://radlex.org/RID/${term.value}">`;
                qs.body.highlight.pre_tags.push(preTags);
                qs.body.highlight.post_tags.push("</a>");*/
            }
            //console.log(JSON.stringify(qs));
            allRadlexQs.push(qs);
            //console.log(itemRadlex);
           
        }
        //console.log(JSON.stringify(allRadlexQs , null ,4));
        try {
            let radlexResult = await Promise.all(allRadlexQs.map(q=> es.esclient.search(q)));
            let cleanRadlexResult =[];
            for (let item of radlexResult) {
                let highlightText = _.get(item.body.hits.hits[0] , "highlight");
                if (highlightText) {
                    item.body.hits.hits[0]._source.highlight = highlightText;
                }
                cleanRadlexResult.push(item.body.hits.hits[0]._source);
            }
            console.log(cleanRadlexResult);
            return cleanRadlexResult;
        } catch (e) {
            console.error(e);
        }
       
    }
}
module.exports = async function (req ,res) {
    req.query = _.omitBy(req.query , v => v === "" || v=== undefined);
    let queryKeys = Object.keys(req.query);
    //const QIDOFunc = _.pickBy(queryKeys , v=> _.has(queryFilter ,v ));
    console.time("get imagingStudies");
    let [imagingStudies , imagingStudiesCount , imagingStudiesAggs] = await images.search(req);
    console.timeEnd("get imagingStudies");
    cleanRadlexResult = await profile.ALL(imagingStudies);
    let patientsItem = [];
    let patientsRadlexItem = [];
    for (let i = 0 ; i< imagingStudies.length ; i++) {
        let patientWithImage = await patients.getImagingStudy(req  , imagingStudies[i]);
        patientsItem.push(patientWithImage);
    }
    for (let j = 0 ; j < cleanRadlexResult.length; j++) {
        let patientWithImageAndRadlex = await patients.getImagingStudy(req  , cleanRadlexResult[j]);
        patientsRadlexItem.push(patientWithImageAndRadlex);
    }
    //console.log(patientsItem);
    console.log(patientsRadlexItem);
    /*console.time("filter items");
    for (let keys in QIDOFunc) {
        let funcName =QIDOFunc[keys];
        let ESField = QIDOInES[funcName];
        patientsItem = await Promise.all(_.filter(patientsItem , v=> queryFilter[funcName](req.query[funcName] , _.get(v , ESField))));
    } 
    console.timeEnd("filter items");*/
    
    return res.send([patientsItem.slice(0,req.query.limit) , imagingStudiesCount ,imagingStudiesAggs , patientsRadlexItem]);
   /* let [report , reportCount] = await reports.search(req);
    console.timeEnd("get report");
    let patientsItem = [];
    console.time("get imagingStudies");
    let [imagingStudies , imagingStudiesCount] = await images.search(req);
    console.timeEnd("get imagingStudies");
    console.time("get report's imagingStudies")
    for (let i = 0 ; i < report.length ; i++) {
        report[i] = await reports.getImage(req  , report[i]);
    }
    await images.getReport(req , imagingStudies , report);
    for (let j= 0 ; j < report.length ; j++) {
        let patientWithReport = await patients.getReport(req  , report[j])
        patientsItem.push(patientWithReport);
    }
    console.timeEnd("get report's imagingStudies")
    patientsItem = await Promise.all(_.compact(patientsItem));
    for (let keys in QIDOFunc) {
        let funcName =QIDOFunc[keys];
        let ESField = QIDOInES[funcName];
        patientsItem = await Promise.all(_.filter(patientsItem , v=> queryFilter[funcName](req.query[funcName] , _.get(v , ESField))));
    }   
    _.sortBy(patientsItem , 'report._score');
    return res.send([patientsItem.slice(0,req.query.limit) , reportCount]);*/
}

module.exports.getContent = profile.ALL;
module.exports.patient = patients;