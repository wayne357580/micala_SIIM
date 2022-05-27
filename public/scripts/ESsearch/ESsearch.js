async function sleep(ms = 0) 
{
    return new Promise(r => setTimeout(r, ms));
}

var searchApp = angular.module("searchApp" , ["ui.bootstrap" , "commonApp"]);
searchApp.controller("searchCtrl" , function($scope ,$sce,searchService , commonService)
{
    $scope.dataList = [];
    $scope.dataRadlexList = [];
    $scope.wadoUrlList = [];
    $scope.viewAndSearchMode = "Image";
    $scope.loggedUser = "";
    $scope.highlightText = "";
    $scope.resultCurPage = 1;
    $scope.resultPerPage = 10;
    $scope.resultCount = 0 ;
    $scope.isChangePage =false;
    $scope.aggsData = [];
    $scope.facets = {};
    $scope.facetFilter = [];
    var keyArray =  ["txtSearch" ,  "Modality" , "fromDate" , "endDate"  ,"StudyInstanceUID" , "PatientID" , "PatientName" , "viewAndSearchMode"];
    let qs = {};
    Micala.createMyAutoComplete(commonService);
    $scope.init = function () {
        $("#txtSearch").focus(function () {
            $(this).change();
        })
        qs = window.location.search;
        
        if (qs == "") {
            window.location.href = "/";
            return;
        }
        commonService.user.init($scope);
        let paramValue = new URLSearchParams(qs);
        for (let i = 0  ; i < keyArray.length  ;i++) {
            let nowItem = keyArray[i];
            if (typeof($scope[nowItem]) == 'undefined') {
                $scope[nowItem]  = "";
            }
            let nowParamValue = paramValue.get(nowItem);
            if (nowParamValue != null) {
                console.log(nowParamValue);
                $scope[nowItem] =nowParamValue;
            }
        }
        $scope.highlightText =  $scope.txtSearch;
        if ($scope.viewAndSearchMode) {
            $(".dropdown-item .check-box").removeClass("checked");
            $(`#di_${$scope.viewAndSearchMode}`).click();
        }
        if ($scope.fromDate && $scope.endDate) {
            let fromDateGtEndDate  = moment($scope.fromDate).isAfter($scope.endDate);
            if (fromDateGtEndDate) {
                $scope.endDate = $scope.fromDate;
            }
        }
       /* angular.element(document).ready(async function () {
            $scope.search();
        });*/
    }
    $scope.txtSearchClick = function (event) {
        console.log($scope.txtSearch);
        if (event.keyCode ==13) {
            event.preventDefault();
            $scope.test();
            let url = "/search?"
            $scope.txtSearch = $("#txtSearch").val();
            for (let i = 0 ; i < keyArray.length ; i++) {
                let nowItem = keyArray[i];
                url += `${nowItem}=${$scope[nowItem]}`
                url += (i!= keyArray.length -1) ? "&" : "";
                console.log($scope[keyArray[i]]);
            }
            window.location.href = url;
        }
    }
    $scope.search = function()
    {
        if ($scope.StudyDate!= undefined && $scope.StudyDate !="")
        {
            let dates = $scope.StudyDate.match(/\d+/g);
            if (dates.length == 1)
            {
                if (!check_Date(dates[0]))
                {
                    alert('Invalid StudyDate');
                }
            }
            else if (dates.length ==2)
            {
                if (!check_Date(dates[0]) || !check_Date(dates[1]))
                {
                    alert('Invalid StudyDate');
                }
            }
        }
        searchService.search($scope).then(async function(res)
        {
            $scope.dataList = res.data[0];
            if ($scope.dataList == null ||$scope.dataList.length <=0 ) {
                return;
            }
            //console.log($scope.dataList);
            $scope.resultCount = res.data[1];
            $scope.aggsData = res.data[2];
            $scope.dataRadlexList = res.data[3];
            console.log($scope.aggsData);
            $scope.wadoUrlList.length = 0;
            $scope.wadoUrlList = [];
            //console.log($scope.dataList);
            for (let i = 0 ; i < $scope.dataList.length ; i++)
            {
                $scope.dataList[i].imagingstudy.identifier = await getOneIdentifier($scope.dataList[i].imagingstudy , "official" , true);
                $scope.dataList[i].imagingstudy.src = `$/reportcontent?id=${$scope.dataList[i].imagingstudy.id}`;
                console.log($scope.dataList[i].imagingstudy.src);
                //console.log($scope.dataList[i].imagingstudy.identifier)
                let wadoUrl = get_One_Wado_Url($scope.dataList[i].imagingstudy ,true);
                //console.log(wadoUrl);
                angular.element(document).ready(async function () {
                    $(`#img_result_${i}`).attr('data-original',wadoUrl);
                });
               /* angular.element(document).ready(async function () {
                    let element = document.getElementById(`imageDiv_${uid}`);
                    await cornerstone.enable(element);
                    loadAndViewImageWeb(element , wadoUrl);
                    $('.cornerstone-canvas').css('height','100%');
                    $('.cornerstone-canvas').width('width','100%');
                    cornerstone.resize(element);
                });*/
            }
             angular.element(document).ready(async function () {
                $(`img.lazy`).lazyload({
                    event: "lazyload"
                  })
                .trigger("lazyload")
             });
        });
    }
    $scope.facetsLevel2CheckChange = function (facetName ,detectionField ,detection) {
        if ($scope.facets[facetName][detectionField]["detection"][detection].checked) {
            let filter = {
                "field" : "detectionFilter" , 
                "detectionField" : detectionField ,
                "value" : detection , 
            }
            $scope.facetFilter.push(filter);
            console.log($scope.facetFilter);
            console.log($scope.facets);
            $scope.search();
        } else {
            $scope.facetFilter = $scope.facetFilter.filter(v => !(v.field== "detectionFilter" && v.value == detection && v.detectionField == detectionField));
            console.log($scope.facetFilter);
            $scope.search();
        }
    }
    $scope.facetsCheckChange = function (facetName , name) {
        if ($scope.facets[facetName][name].checked) {
            console.log($scope.facets[facetName][name]);
            let filter = {
                "field" : facetName , 
                "value" : name , 
            }
            $scope.facetFilter.push(filter);
            console.log($scope.facetFilter);
            console.log($scope.facets);
            $scope.search();
        } else {
            $scope.facetFilter = $scope.facetFilter.filter(v=> !(v.field== facetName&& v.value == name));
            $scope.facetFilter = $scope.facetFilter.filter(v=> !(v.detectionField == name));
            delete $scope.facets[facetName][name]["detection"];
            console.log($scope.facetFilter);
            $scope.search();
        }
    }

    $scope.refreshData = function (iText) {
        let qs = $scope.highlightText;
        let qsAll = qs.split(' ');
        let haveStart = false;
        for (let i = 0 ;  i < qsAll.length ; i++) {
            let strLen = qsAll[i].length;
            let nowqsRegex = new RegExp(qsAll[i] , 'gi');
            let searchIndex = iText.search(nowqsRegex);
            if (searchIndex == -1) {
                continue;
            }
            let oriText = iText.slice(searchIndex , searchIndex + strLen);
            for (let x= searchIndex;x >0 ; x--) {
                if (haveStart) {
                    break;
                }
                if (iText[x] == '.') {
                    iText = iText.slice(x+2);
                   //console.log(iText);
                    haveStart = true;
                    break;
                }
            }
            iText = iText.replace(nowqsRegex , `<span class="highlight">${oriText}</span>`);
        }
        return $sce.trustAsHtml(iText);
    }

    $scope.highlight = function (iText) {
        try {
            let highlight = iText["highlight"]["report.Records.FULLTEXT"][0];
            return $sce.trustAsHtml(highlight);
        } catch (e) {
           try {
                return  $sce.trustAsHtml(iText.report.Records.FULLTEXT);
           } catch (e) {
                return "";
           }
        }
    }
    $scope.viewReport = async function (iItem , $event) {
        let paramValue = new URLSearchParams(qs);
        let id = iItem.imagingstudy.id;
        let newItem = $scope.dataRadlexList.find(v=> v.imagingstudy.id == id);
        console.log(newItem);
        iItem.txtSearch = paramValue.get('txtSearch');
        iItem.imagingstudy.newhighlight = newItem.imagingstudy.highlight;
        searchService.storeQs(iItem).then(function (res) {
            if(res.status == 200) {
                
                if ($event.which == 2) {
                    window.open('/reportContent?id=' + id);
                } else if ($event.which == 1) {
                    window.open('/reportContent?id=' + id , "_self");
                }
            }
        });
    }

    $scope.watchImage =async function (i_Item)
    {
        await sleep(1000);
        console.log(i_Item);
        let qido_Uri = getQIDOViewerUri(i_Item);
        let tempIframe = document.createElement('iframe');
        tempIframe.src = qido_Uri;
        let imageFrame = document.getElementById('imageFrame');
        if (imageFrame.childElementCount > 0)
        {
            imageFrame.removeChild(imageFrame.lastChild);
        }
        tempIframe.height = document.getElementById("imageModalDialog").scrollHeight -170;
        tempIframe.width = "100%";
        imageFrame.appendChild(tempIframe);
    }

    $scope.enableElement = function (elementID)
    {
        let element = document.getElementById(elementID);
        cornerstone.enable(element);
    }

    $scope.test = function()
    {

        let  params =
        {
            StudyDate : get_Date_Query($scope.fromDate , $scope.endDate),
            ModalitiesInStudy : $scope.Modality,
            PatientName : $scope.PatientName,
            PatientID : $scope.PatientID,
            StudyInstanceUID : $scope.StudyInstanceUID , 
            reportQuery : $scope.txtSearch
        }
        console.log(params);
        let url = "/search?"
        for (let i = 0 ; i < keyArray.length ; i++) {
            let nowItem = keyArray[i];
            url += `${nowItem}=${$scope[nowItem]}`
            url += (i!= keyArray.length -1) ? "&" : "";
            console.log($scope[keyArray[i]]);
        }
        window.location.href = url;
    }

    $scope.onClick_Patient_Tr = function (i_Item)
    {
        $scope.wadoUrlList.length = 0;
        $scope.wadoUrlList =[];
        let host = `${window.location.hostname}:${window.location.port}`;
        let studyUID = get_StudyUID(i_Item);
        let url = `http://${host}/api/dicom/wado/?requestType=WADO&studyUID=${studyUID}`;
        let seriesList = get_Series(i_Item);
        for (let i = 0 ; i < seriesList.length ; i++)
        {
            for (let x= 0 ; x <seriesList[i].instance.length ; x++)
            {
                $scope.wadoUrlList.push(`${url}&seriesUID=${seriesList[i].uid}&objectUID=${seriesList[i].instance[x].uid}&contentType=application/dicom`);
            }
        }
        //console.log($scope.wadoUrlList);
        //$scope.wadoUrlList = i_Item;
        
    }
    $scope.setVal = function (element , val) {
        $scope[element] = val ;
    }
    $scope.$watch("resultCurPage",function(newValue,oldValue){
        // your code goes here...
        $scope.search();
    });

    $scope.clearOption = function () {
        let optionArray =  [ "Modality" , "fromDate" , "endDate"  ,"StudyInstanceUID" , "PatientID" , "PatientName" ];
        for (let option of optionArray) {
            $scope[option] = "";
        }
    }
});

searchApp.service("searchService" , function($http)
{
    return ({
        search: search , 
        storeQs : storeQs
    });
    function search($scope) {
        let request = $http({
            method : "POST" ,
            url :"/SE/search/my-report" , 
            params :
            {
                StudyDate : get_Date_Query($scope.fromDate , $scope.endDate),
                ModalitiesInStudy : $scope.Modality,
                PatientName : $scope.PatientName,
                PatientID : $scope.PatientID,
                StudyInstanceUID : $scope.StudyInstanceUID , 
                ss : $scope.txtSearch.trim() , 
                viewAndSearchMode : $scope.viewAndSearchMode , 
                skip : ($scope.resultCurPage -1) * $scope.resultPerPage , 
                limit : $scope.resultPerPage , 
            } ,
            data : {
                filter : $scope.facetFilter
            }
        });
        return (request.then(handleSuccess , handleError));
    }

    function storeQs (item) {
        let request = $http({
            method : "POST" ,
            url :"/api/search/qs" , 
            data : item
        });
        return (request.then(handleSuccess , handleError));
    }
    function handleSuccess(res) {
        return res;
    }
    function handleError(res) {
        return res
    }
});

