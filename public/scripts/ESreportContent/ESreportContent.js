const loding_template = `<img src="../images/loading.gif"></div>`
const nodata_template = `<h3>No data<h3/>`;

let app = new Vue({
    el: '#app',
    data() {
        return {
            display_mode: 'search',
            /* Search View */
            search_text: "",
            result_display: "",
            result_list: [],
            /* Result view */
            bundle: null,
            IS_display: nodata_template, // 顯示在IS的html
            IS_display_path: [], // fetch path
            IS_list: [], // ImagingStudy resource 
            IS_list_page: 0,
            IS_display_img: loding_template,
            IS_display_mode: true,

            DR_display: nodata_template, // 顯示在DR的html
            DR_display_path: [], // fetch path
            DR_list: [], // DiagnosticReport resource 
            DR_list_page: 0,
            bundle_url: 'https://tony880321.github.io/micala_SIIM/public/bundle.json'
        }
    },
    created: function () {
        window.IS_btnClick = this.IS_btnClick
        window.DR_btnClick = this.DR_btnClick
        //https://blog.csdn.net/yan_dk/article/details/109352118
    },
    computed: {
        async IS_display_refresh() {
            this.IS_display = loding_template
            this.IS_display_carousel = carouselStr = loding_template
            // 根據[IS_display_path]從[IS_list]的第[IS_list_page]個物件取得並解析
            if (obj = this.IS_list[this.IS_list_page]) {
                obj = obj.resource
                let targetObj = obj
                for (let step of this.IS_display_path) {
                    targetObj = targetObj[step]
                }
                let htmlStr = this.parse_object(true, targetObj, 'IS')

                // Imaging obj
                if (compare_path(['series', -1, 'instance', -1], this.IS_display_path)) {
                    if (attr = parse_IS(obj, this.IS_display_path)) {
                        htmlStr += `<a class="btn btn-secondary my-3 w-75" href="${attr.viewerUrl}?StudyInstanceUID=${attr.studyUID}" target="_blank">Open ${attr.viewer} viewer</a><br/>`
                        // load image
                        let imgUrl = get_One_Wado_Url(obj, true)

                        if (!await check_img(imgUrl)) {
                            imgUrl = '../images/notfound.jpg'
                        }
                        console.log(imgUrl)
                        htmlStr += `<img class='img-fluid w-100 img-thumbnail mb-2' src="${imgUrl}">`
                    }
                }

                // 生成網頁
                if (this.IS_display_path.length == 0) {
                    this.IS_display_img = await make_carousel(getAllWadoUrl(obj, true))
                }
                this.IS_display = htmlStr
            } else {
                this.IS_display = nodata_template
            }
            /* function */
            function compare_path(target, path) {
                if (target.length == path.length) {
                    for (let i = 0; i < target.length; i++) {
                        if ((typeof target[i] == 'string') && (target[i] != path[i])) {
                            return false
                        } else if ((typeof target[i] == 'number') && (typeof parseInt(path[i]) != 'number')) {
                            return false
                        }
                    }
                    return true
                } else {
                    return false
                }
            }
            function parse_IS(obj, path) {
                let res = {}
                // Check type
                if (check_sopClass(obj, path) && (obj[path[0]]['modality']['Code'] == 'SM')) {
                    res.viewerUrl = config.bluelight_WSI_baseURL
                    res.viewer = "BlueLight-WSI"
                } else {
                    res.viewerUrl = config.bluelight_baseURL
                    res.viewer = "BlueLight"
                }
                // Get study UID
                if (obj.identifier) {
                    let studyUID = obj.identifier.filter(r => { return r.system == 'urn:dicom:uid' })
                    if (studyUID.length == 1) {
                        res.studyUID = studyUID[0].value.replace(/[^\d.-]/g, '')
                    } else {
                        console.log(`Exception: multiple studyUID, ${obj.id}`)
                    }
                }
                return res
            }
            function check_sopClass(obj, path) {
                for (let step of path) {
                    obj = obj[step]
                }
                console.json(obj)
                return obj.sopClass.code.replace(/[^\d.-]/g, '') == '1.2.840.10008.5.1.4.1.1.77.1.6'
            }
            async function check_img(url) {
                await axios(url)
                    .then(res => {
                        return true
                    }).catch(e => {
                        return false
                    })
            }
            async function make_carousel(urlList) {
                let htmlStr = `<div id="carouselExampleCaptions" class="carousel slide" data-bs-ride="carousel"><div class="carousel-inner">`
                let isActive = false
                for (let item of urlList) {
                    if (!await check_img(item.url)) {
                        let imgURL = '../images/notfound.jpg'
                        htmlStr += `<div class="carousel-item ${!isActive && "active"}">
                            <img src="${imgURL}" class="d-block w-100" alt="${imgURL}">
                        </div>`
                        break
                    } else {
                        htmlStr += `<div class="carousel-item ${!isActive && "active"}">
                            <img src="${item.url}" class="d-block w-100" alt="${item.url}">
                            <div class="carousel-caption d-none d-md-block text-nowrap">                                
                                <small>Study ID：${item.studyUID}</small><br/>
                                <small>Series ID：${item.seriesUID}</small><br/>
                                <small>Instance ID：${item.instanceUID}</small>
                            </div>
                        </div>`
                    }
                    isActive = true
                }

                htmlStr += `</div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                </div>`
                return htmlStr
            }
        },
        DR_display_refresh() {
            this.DR_display = loding_template
            if (obj = this.DR_list[this.DR_list_page]) {
                obj = obj.resource
                for (let step of this.DR_display_path) {
                    obj = obj[step]
                }

                this.DR_display = this.parse_object(true, obj, 'DR')
            } else {
                this.DR_display = nodata_template
            }
        },
        result_display_result() {
            let htmlStr = ``
            if (this.result_list.length > 0) {
                for (let i = 0; i < this.result_list.length; i++) {
                    let bundle = this.result_list[i]
                    let IS = this.get_resource(bundle.resource.entry, "ImagingStudy")
                    let DR = this.get_resource(bundle.resource.entry, "DiagnosticReport")
                    htmlStr += `<div class="card mb-2 text-start">
                    <div class="card-header">
                        <h4 class="card-title mb-0">
                            <span>${i + 1}. Resource ID：</span>
                            <button class="btn btn-link p-0 m-0" onclick="viewBundle('${bundle.resource.id}')">${bundle.resource.id}</button>
                        </h4>                                      
                    </div>
                    <div class="card-body">                  
                      <div>ImagingStudy<span class="badge rounded-pill bg-success ms-2">${IS.length}</span></div>
                      <div>DiagnosticReport<span class="badge rounded-pill bg-success ms-2">${DR.length}</span></div>
                    </div>
                  </div>`
                }
            } else {
                htmlStr = `<div class='h-100 text-center'><h3 class='mb-0'>No data</h3></div>`
            }

            this.result_display = htmlStr
        }
    },
    methods: {
        /* Search */
        get_searchRes() {
            return new Promise((reslove, reject) => {
                this.display_mode = 'search'
                this.result_display = loding_template
                let searchURL = `${config.burni_server_baseURL}/fhir/Bundle?_text=${this.search_text}`
                //let searchURL = "../scripts/bundle-searchset.json"
                axios.get(searchURL)
                    .then(res => {
                        if (res.data.entry) {
                            this.result_list = res.data.entry
                            this.result_display_result
                            return reslove()
                        } else {
                            this.result_list = []
                            this.result_display_result
                        }
                    }).catch(err => {
                        alert(err.message)
                        console.log(err)
                        return reject()
                    })
            })

        },
        /* Result */
        get_resource(arr, resource) {
            return arr.filter(r => { return r.resource.resourceType == resource })
        },
        change_page(targetList, action) {
            if (targetList == 'IS') {
                this.IS_display = loding_template
                this.IS_list_page = Math.min(Math.max(0, this.IS_list_page + action), this.IS_list.length - 1)
                this.IS_display_path = []
                this.IS_display_refresh
            } else if (targetList == 'DR') {
                this.DR_display = loding_template
                this.DR_list_page = Math.min(Math.max(0, this.DR_list_page + action), this.DR_list.length - 1)
                this.DR_display_path = []
                this.DR_display_refresh
            }
        },
        IS_btnClick(id) {
            this.IS_display_path.push(id)
            this.IS_display_refresh
        },
        DR_btnClick(id) {
            this.DR_display_path.push(id)
            this.DR_display_refresh
        },
        parse_path(list) {
            if (list.length > 0) {
                let htmlStr = `<nav class='d-inline'><ol class="breadcrumb mb-0">`
                for (let item of list) {
                    htmlStr += `<li class="breadcrumb-item">${item}</li>`
                }
                htmlStr += `</ol></nav>`
                return htmlStr
            }
        },
        parse_object(isBaseTable, obj, target) {
            if (isBaseTable) {
                var htmlStr = `<table class="table table-bordered align-middle text-center mb-0">`
            } else {
                var htmlStr = `<table class="table table-sm table-bordered table-hover align-middle text-center mb-0">`
            }
            htmlStr += `<thead class='table-light'><tr><th scope="col">Column</th><th scope="col">Value</th></tr></thead>`
            htmlStr += `<tbody>`
            for (let key in obj) {
                let value = obj[key]
                if (typeof value == 'object') {
                    htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-2">
                            <button class="btn btn-sm btn-success w-50" onclick="${target}_btnClick('${key}')">
                            <strong >View</strong>
                            <span class="badge rounded-pill bg-warning text-dark ms-1">${(value.length) ? (value.length) : 1}</span>
                        </button></td></tr>`
                } else {
                    if (key == 'reference') {
                        value = this.make_referenfce(target, value)
                    }
                    htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-1">${value}</td></tr>`
                }
            }
            htmlStr += `</tbody></table>`
            return htmlStr
        },
        make_referenfce(target, ref) {
            if (target == 'IS') {
                let fullUrl = this.IS_list[this.IS_list_page].fullUrl
                return `<a class="btn btn-link" href="${fullUrl.split('/fhir')[0]}/fhir/${ref}" target="_blank">${ref}</a>`
            } else if (target == 'DR') {
                let fullUrl = this.DR_list[this.DR_list_page].fullUrl
                return `<a class="btn btn-link" href="${fullUrl.split('/fhir')[0]}/fhir/${ref}" target="_blank">${ref}</a>`
            }
        },
        get_bundle(id) {
            this.IS_display = loding_template
            this.DR_display = loding_template
            this.display_mode = 'result'
            console.log(JSON.parse(JSON.stringify(this.result_list)))
            let matchList = this.result_list.filter(r => { return r.resource.id == id })
            if (matchList.length == 1) {
                this.bundle = matchList[0].resource
                if (entry = this.bundle.entry) {
                    // Get resource
                    this.IS_list = this.get_resource(entry, 'ImagingStudy')
                    this.DR_list = this.get_resource(entry, 'DiagnosticReport')
                    this.IS_display_refresh
                    this.DR_display_refresh
                }
            }
        },
        back_search() {
            //this.display_mode = 'search'
            //this.bundle = null
            let url = new URL(location.href);
            document.location.href = `${location.protocol}//${location.hostname}${location.port && `:${location.port}`}${location.pathname}?_text=${url.searchParams.get('_text')}`;
        },
        search_resource() {
            if (location.hostname.includes('github.io')) {
                document.location.href = `/${config.github_repository_name}/public/html/ESreportContent.html?_text=${this.search_text}`;
            } else {
                document.location.href = `/public/html/ESreportContent.html?_text=${this.search_text}`;
            }
        }
    },
    async mounted() {
        try {
            let url = new URL(location.href);
            if (searchText = url.searchParams.get('_text')) {
                this.search_text = searchText
                await this.get_searchRes()
                if (bundleId = url.searchParams.get('_bundle')) {
                    this.get_bundle(bundleId)
                };
            }
        } catch (e) {
            console.log(e);
        }
    }
})

console.json = (j) => {
    if (j) {
        console.log(JSON.parse(JSON.stringify(j)))
    } else {
        console.log(j)
    }
}


function firstUpperCase(s) {
    return s[0].toUpperCase() + s.slice(1)
}

function viewBundle(id) {
    document.location.href = `${location.href}&_bundle=${id}`;
}

/*
function parse_list(objKey, list) {
    let accordion_ID = make_ID(13)
    let htmlStr = `<div class="accordion m-2" id="accordion_${accordion_ID}">`
    let row_count = 1
    for (let row of list) {
        let element_id = make_ID(12)
        htmlStr += `<div class="accordion-item">
        <h2 class="accordion-header" id="heading_${element_id}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${element_id}">
            ${row_count}
          </button>
        </h2>
        <div id="collapse_${element_id}" class="accordion-collapse collapse" data-bs-parent="#accordion_${accordion_ID}">
          <div class="accordion-body">
            ${parse_object(false, row)}
          </div>
        </div>
        </div>
      `
        row_count++
    }
    htmlStr += '</div>'
    return htmlStr
}

function make_ID(pasLen) {
    let pasArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let password = '';
    let pasArrLen = pasArr.length;
    for (let i = 0; i < pasLen; i++) {
        let x = Math.floor(Math.random() * pasArrLen);
        password += pasArr[x];
    }
    return password;
}
*/
