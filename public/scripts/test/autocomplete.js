let autocompleteApp =  angular.module("autocompleteApp" , []);

autocompleteApp.controller("autocompleteCtrl" , function ($scope ,$sce , autocompleteService) {
    const instance = new AutoSuggest({
        onChange: function (suggestion) {
            const change = suggestion.insertHtml || suggestion.insertText;
            console.log('"' + change + '" has been inserted into #' + this.id);
        },
        suggestions: [
            function(keyword, callback) {
                keyword = keyword.toLowerCase();
                console.log(keyword);
                let results = [];
                let dataset = [];
                autocompleteService.getTerms(keyword).then (function(res) {
                    dataset = res.data.buckets;
                    dataset.forEach(function(word) {
                        word = word.key;
                        if (!word.indexOf(keyword) &&
                            word !== keyword &&
                            results.indexOf(word) === -1
                        ) {
                            console.log(word)
                            results.push(word);
                        }
                    });
                    setTimeout(function () {
                        callback(results);
                    }, 100);
                })
            }
        ]
    },  $('#textarea'));
    const instanceSuggestion = new AutoSuggest({
        onChange: function (suggestion) {
            const change = suggestion.insertHtml || suggestion.insertText;
            console.log('"' + change + '" has been inserted into #' + this.id);
        },
        suggestions: [
            function(keyword, callback) {
                keyword = keyword.toLowerCase();
                console.log(keyword);
                let results = [];
                let dataset = [];
                autocompleteService.getTermsSuggestion(keyword).then (function(res) {
                    dataset = res.data;
                    dataset.forEach(function(word) {
                        word = word.text;
                        if (
                            word !== keyword &&
                            results.indexOf(word) === -1
                        ) {
                            console.log(word)
                            results.push(word);
                        }
                    });
                    setTimeout(function () {
                        callback(results);
                    }, 100);
                })
            }
        ]
    },  $('#textarea-suggestion'));
    const reportSuggestion = new AutoSuggest({
        onChange: function (suggestion) {
            const change = suggestion.insertHtml || suggestion.insertText;
            console.log('"' + change + '" has been inserted into #' + this.id);
        },
        suggestions: [
            function(keyword, callback) {
                keyword = keyword.toLowerCase();
                console.log(keyword);
                let results = [];
                let dataset = [];
                autocompleteService.getReportSuggestion(keyword).then (function(res) {
                    dataset = res.data;
                    dataset.forEach(function(word) {
                        word = word.key;
                        if (
                            word !== keyword &&
                            results.indexOf(word) === -1
                        ) {
                            console.log(word)
                            results.push(word);
                        }
                    });
                    setTimeout(function () {
                        callback(results);
                    }, 100);
                })
            }
        ]
    },  $('#textarea-report-suggestion'));
});

autocompleteApp.service("autocompleteService" , function ($http) {
    return ({
        getTerms : getTerms , 
        getTermsSuggestion : getTermsSuggestion ,
        getReportSuggestion : getReportSuggestion
    });
    function getTerms (keyword) {
        let request = $http({
            method : "GET" ,
            url :"/SE/search/terms/autocomplete/my-terms" , 
            params : {
                ss : keyword , 
                field : "terms"
            }
        });
        return (request.then(handleSuccess , handleError));
    }

    function getTermsSuggestion (keyword) {
        let request = $http({
            method : "GET" ,
            url :"/SE/search/terms/suggestion/my-terms" , 
            params : {
                ss : keyword , 
                field : "terms"
            }
        });
        return (request.then(handleSuccess , handleError));
    }

    function getReportSuggestion (keyword) {
        let request = $http({
            method : "GET" ,
            url :"/SE/search/report/suggestion/my-report" , 
            params : {
                ss : keyword , 
                field : "Records.FULLTEXT"
            }
        });
        return (request.then(handleSuccess , handleError));
    }

    function handleError(res) {
        console.log(res);
        return res;
    }

    function handleSuccess (res) {
        console.log(res);
        return res;
    }
});