let autocompleteApp =  angular.module("autocompleteApp" , []);

autocompleteApp.controller("autocompleteCtrl" , function ($scope ,$sce , autocompleteService) {
    let nowX = 0  , nowY = 0 ; 
    document.getElementById("textarea").addEventListener('keyup', e => {
        nowX = e.target.offsetLeft + e.target.selectionEnd;
        nowY = e.target.offsetTop + e.target.selectionEnd;
        console.log('Caret at: ', e.target.offsetLeft + e.target.selectionEnd);
        console.log('Caret at: ', e.target.offsetTop + e.target.selectionEnd);
    });
    new autoComplete({
        data: {                              // Data src [Array, Function, Async] | (REQUIRED)
          src: async () => {
            return new Promise ((resolve) => {
                // User search query
                const query = document.querySelector("#txtAutoComplete").value
                // Fetch External Data Source
                let dataset = [];
                autocompleteService.getTerms(query).then (function(res) {
                    dataset = res.data.buckets;
                    return resolve(dataset);
                });
                // Return Fetched data
            });
            // API key token
          },
          key: ["key"],
          cache: false
        },
        selector: "#txtAutoComplete",           // Input field selector              | (Optional)
                    // Post duration for engine to start | (Optional)
        searchEngine: "strict",              // Search Engine type/mode           | (Optional)
        resultsList: {                       // Rendered results list object      | (Optional)
            render: true,
            container: source => {
                source.setAttribute("id", "txtAutoComplete_list");
                
            },
            destination: document.querySelector("#txtAutoComplete"),
            position: "afterend",
            element: "ul",
            navigation : (event, input, resListElement, onSelection, resListData) => {
                console.log(event);
                const select = {
                    result: "autoComplete_result",
                    highlight: "autoComplete_highlighted",
                    selectedResult: "autoComplete_selected"
                };
                const keys = {
                    ENTER: 13,
                    ARROW_UP: 38,
                    ARROW_DOWN: 40
                };
                const li = resListElement.childNodes,
                liLength = li.length - 1;
                let liSelected = undefined,
                    next;
                // Remove selection class
                const removeSelection = direction => {
                    liSelected.classList.remove("autoComplete_selected");
                    if (direction === 1) {
                    next = liSelected.nextSibling;
                    } else {
                    next = liSelected.previousSibling;
                    }
                };
                // Add selection class
                const highlightSelection = current => {
                    liSelected = current;
                    liSelected.classList.add(select.selectedResult);
                };
                // Keyboard action
                input.onkeydown = event => {
                    if (li.length > 0) {
                    switch (event.keyCode) {
                        // Arrow Up
                        case keys.ARROW_UP:
                        // Prevent cursor relocation
                            event.preventDefault();
                            if (liSelected) {
                                removeSelection(0);
                                if (next) {
                                    highlightSelection(next);
                                    let id = liSelected.getAttribute("data-id");
                                    onSelection(resListData.list[id]);
                                } else {
                                    highlightSelection(li[liLength]);
                                    onSelection(resListData.list[liLength]);
                                }
                            } else {
                                highlightSelection(li[liLength]);
                                onSelection(resListData.list[liLength]);
                            }
                            break;
                        // Arrow Down
                        case keys.ARROW_DOWN:
                            if (liSelected) {
                                removeSelection(1);
                                if (next) {
                                    highlightSelection(next);
                                    let id = liSelected.getAttribute("data-id");
                                    onSelection(resListData.list[id]);
                                } else {
                                    highlightSelection(li[0]);
                                    onSelection(resListData.list[0]);
                                }
                            } else {
                                highlightSelection(li[0]);
                                onSelection(resListData.list[0]);
                            }
                            break;
                        case keys.ENTER:
                            if (liSelected) {
                                let id = liSelected.getAttribute("data-id");
                                console.log(resListData.list[id]);
                                onSelection(resListData.list[id]);
                            }
                            break;
                    }
                    }
                };
                // Mouse action
                li.forEach(selection => {
                    let id = selection.getAttribute("data-id");
                    selection.onmousedown = event => onSelection(resListData.list[id]);
                });
            }
        },
        maxResults: 5,                         // Max. number of rendered results | (Optional)
        highlight: true,                       // Highlight matching results      | (Optional)
        resultItem : {
            content : (data, source) => {
                source.innerHTML = data.match;
                $('.autoComplete_result').css('margin' , 'auto');
            }
        },
        noResults: () => {                     // Action script on noResults      | (Optional)
            const result = document.createElement("li");
            result.setAttribute("class", "no_result");
            result.setAttribute("tabindex", "1");
            result.innerHTML = "No Results";
            document.querySelector("#txtAutoComplete_list").appendChild(result);
        },
        onSelection: feedback => {             // Action script onSelection event | (Optional)
            const selection = feedback.value.key;
            console.log(feedback);
            $("#txtAutoComplete").val(selection);
        }
    });
    
    /*const instance = new AutoSuggest({
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
    },  $('#textarea'));*/
    /*const instanceSuggestion = new AutoSuggest({
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
    },  $('#textarea-report-suggestion'));*/
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
        //console.log(res);
        return res;
    }
});