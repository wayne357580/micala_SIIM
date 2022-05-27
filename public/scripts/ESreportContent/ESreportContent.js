


let reportContentApp = angular.module("reportContentApp" , ["commonApp" , "ui.bootstrap"]);

reportContentApp.controller("reportContentCtrl" , function ($scope , reportContentService , commonService , $sce) {
    init();
    $scope.wadoUrlList = [];
    $scope.imagingStudy = {};
    $scope.FULLTEXT = "";
    $scope.patient  = {};
    $scope.selectProfile = "";
    $scope.test = function () {
        console.log($scope.selectProfile);
    }
    function init() {
        Micala.createMyAutoComplete(commonService);
        let qs = window.location.search;
        
        if (qs == "") {
            window.location.href = "/";
            return;
        }
        let paramValue = new URLSearchParams(qs);
        let id = paramValue.get("id");
        console.log(id);
        reportContentService.getContent(id).then(function (res) {
            console.log("report content"  , res.data);
            if (res.status == 200) {
                console.log(res.data);
                $scope.patient = res.data;
                $scope.imagingStudy = $scope.patient.imagingstudy;
                if ($scope.imagingStudy.highlight) {
                    $scope.FULLTEXT = $scope.imagingStudy.highlight["report.Records.FULLTEXT.forRadlex"][0];
                } else {
                    $scope.FULLTEXT = $scope.imagingStudy.report.Records.FULLTEXT;
                }
            } else {
                console.log("somthing wrong");
                return;
            }
            getOneIdentifier( $scope.imagingStudy,"official" , true)
            $scope.wadoUrlList = getAllWadoUrl($scope.imagingStudy, true);
            angular.element(document).ready(async function () {
                $(`img.lazy`).lazyload({
                    event: "lazyload" 
                  })
                .trigger("lazyload");
             });
            console.log($scope.wadoUrlList);
        });
        commonService.user.init($scope);
       /* reportContentService.getQs().then(function (res) {
            if (res.status == 200) {
                console.log(res.data);
                $scope.patient = res.data;
                $scope.imagingStudy = $scope.patient.imagingstudy;
                if ($scope.imagingStudy.newhighlight) {
                    $scope.FULLTEXT = $scope.imagingStudy.newhighlight["report.Records.FULLTEXT.forRadlex"][0];
                } else {
                    $scope.FULLTEXT = $scope.imagingStudy.report.Records.FULLTEXT;
                }
            } else {
                console.log("somthing wrong");
                return;
            }
            $scope.wadoUrlList = getAllWadoUrl($scope.imagingStudy, true);
            angular.element(document).ready(async function () {
                $(`img.lazy`).lazyload({
                    event: "lazyload" 
                  })
                .trigger("lazyload");
             });
            console.log($scope.wadoUrlList);
        });*/
    }

    $scope.reportBold= function (iText) {
        let reg = new RegExp(/^.*[A-Z]:/gm);
        let matchStr = iText.match(reg);
        /*for (let i = 0 ; i < matchStr.length ; i++) {
            iText = iText.replace(matchStr[i] , `<span style="font-weight:bold">${matchStr[i]}</span>`)
        }*/
        iText = iText.replace(reg , `<span style="font-weight:bold">$&</span>`)
        //console.log(iText);
        return $sce.trustAsHtml(iText);
    }

    $scope.setVal = function (name, val) {
        $scope[name] = val;
    }

    $scope.txtSearchClick = function (event) {
        console.log($scope.txtSearch);
        if (event.keyCode ==13) {
            event.preventDefault();
            $scope.test();
            let url = "/search?"
            $scope.txtSearch = $("#txtSearch").val();
           /* for (let i = 0 ; i < keyArray.length ; i++) {
                let nowItem = keyArray[i];
                url += `${nowItem}=${$scope[nowItem]}`
                url += (i!= keyArray.length -1) ? "&" : "";
                console.log($scope[keyArray[i]]);
            }*/
            window.location.href = `${url}txtSearch=${$scope.txtSearch}`;
        }
    }
});


reportContentApp.service("reportContentService" , function ($http) {
    return ({
        getQs : getQs , 
        getContent : getContent
    });
    function getQs() {
        let req = $http({
            method : "GET" , 
            url : "/api/search/qs"
        })
        return req.then(handleSuccess , handleError);
    }
    function getContent(id) {
        let req = $http({
            method : "GET" , 
            url : "/api/search/content/" + id
        })
        return req.then(handleSuccess , handleError);
    }
    function handleSuccess (res) {
        return res;
    }
    function handleError (res) {
        console.log(res);
        return res;
    }
});