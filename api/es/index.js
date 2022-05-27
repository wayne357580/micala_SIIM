const router = require("express").Router();
const {validateParams} = require('../validator');
const Joi = require("joi");

//
router.get("/ngsearch/:index" , require("./controller/ngsearch"));


router.get("/search/terms/autocomplete/:index" , require("./controller/terms/autocomplete"));

//terms 詞彙字典 文字建議
router.get("/search/terms/suggestion/:index" , require("./controller/terms/suggestion"));

//report 報告 autocomplete
router.get("/search/report/suggestion/:index" , require("./controller/report/autocomplete"));

router.post("/search/:index",validateParams({
    ss : Joi.string().required() ,
    ModalitiesInStudy : Joi.string().allow('' , null ) , 
    PatientName : Joi.string().allow('' , null ) , 
    PatientID : Joi.string().allow('' , null ) , 
    StudyInstanceUID : Joi.string().allow('' , null ) , 
    StudyDate : Joi.string().allow('', null) , 
    skip : Joi.number() , 
    viewAndSearchMode : Joi.string().allow('' , null),
    limit : Joi.number() , 
    filter : Joi.array()
} , "query" , {allowUnknown: false}) , require('./controller/search'));


module.exports = router;