

async function sleep(ms = 0) 
{
    return new Promise(r => setTimeout(r, ms));
}

var searchApp = angular.module("searchApp" , ["ui.bootstrap" , "commonApp"]);
searchApp.controller("searchCtrl" , function($scope ,$sce,searchService , commonService)
{
    $scope.dataList = [];
    $scope.wadoUrlList = [];
    $scope.viewAndSearchMode = "Image";
    $scope.loggedUser = "";
    $scope.highlightText = "";
    $scope.resultCurPage = 1;
    $scope.resultPerPage = 10;
    $scope.isChangePage =false;
    var keyArray =  ["txtSearch" ,  "Modality" , "fromDate" , "endDate"  ,"StudyInstanceUID" , "PatientID" , "PatientName" , "viewAndSearchMode"];
    $scope.init = function () {
        let qs = window.location.search;
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
        angular.element(document).ready(async function () {
            $scope.QIDO();
        });
        //if (paramValue.get('txtSearch')!=null) {
        //    $scope.txtSearch =paramValue.get('txtSearch');
        //}
    }
    $scope.txtSearchClick = function (event) {
        if (event.keyCode ==13) {
            event.preventDefault();
            $scope.test();
            let url = "/search?"
            for (let i = 0 ; i < keyArray.length ; i++) {
                let nowItem = keyArray[i];
                url += `${nowItem}=${$scope[nowItem]}`
                url += (i!= keyArray.length -1) ? "&" : "";
                console.log($scope[keyArray[i]]);
            }
            window.location.href = url;
        }
        $scope.isFirstSearch = false;
    }
    $scope.QIDO = function()
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
        searchService.QIDO($scope).then(async function(res)
        {
            $scope.dataList = res.data;
            if ($scope.dataList == null ||$scope.dataList.length <=0 ) {
                return;
            }
            $scope.wadoUrlList.length = 0;
            $scope.wadoUrlList = [];
            //console.log($scope.dataList);
            for (let i = 0 ; i < $scope.dataList.length ; i++)
            {
                $scope.dataList[i].identifier = await getOneIdentifier($scope.dataList[i] , "usual" , false);
                let wadoUrl = get_One_Wado_Url($scope.dataList[i] ,true);
                angular.element(document).ready(async function () {
                    $(`#img_result_${i}`).attr('src',wadoUrl);
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
        });
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


    $scope.viewReport = async function (iItem , $event) {
        searchService.storeQs(iItem).then(function (res) {
            if(res.status == 200) {
                if ($event.which == 2) {
                    window.open('/dicom/reportContent');
                } else if ($event.which == 1) {
                    window.open('/dicom/reportContent' , "_self");
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

   $scope.resultPaginate = function(value) {
        let start , end  , index ;
        start = ($scope.resultCurPage -1 ) * $scope.resultPerPage;
        end = start + $scope.resultPerPage;
        index = $scope.dataList.indexOf(value);
        if (start <= index && index < end && value.identifier) {
            if ($scope.resultCurPage >= 2 || $scope.isChangePage) {
                let wadoUrl = get_One_Wado_Url(value ,true);
                angular.element(document).ready(async function () {
                    $(`#img_result_${index-start}`).attr('src',wadoUrl);
                });
                $scope.isChangePage = true;
            }
            return true;
        } else {
            return (start <= index && index < end);
        }
    }
});

searchApp.service("searchService" , function($http)
{
    return ({
        QIDO: QIDO , 
        storeQs : storeQs
    });
    function QIDO($scope) {
        let request = $http({
            method : "GET" ,
            url :"/api/dicom/qido/studies" , 
            params :
            {
                StudyDate : get_Date_Query($scope.fromDate , $scope.endDate),
                ModalitiesInStudy : $scope.Modality,
                PatientName : $scope.PatientName,
                PatientID : $scope.PatientID,
                StudyInstanceUID : $scope.StudyInstanceUID , 
                reportQuery : $scope.txtSearch , 
                viewAndSearchMode : $scope.viewAndSearchMode
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

