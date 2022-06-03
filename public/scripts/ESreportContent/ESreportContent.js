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
        window.get_bundle = this.get_bundle
        //https://blog.csdn.net/yan_dk/article/details/109352118
    },
    computed: {
        IS_display_refresh() {
            // 根據[IS_display_path]從[IS_list]的第[IS_list_page]個物件取得並解析
            this.IS_display = loding_template
            if (obj = this.IS_list[this.IS_list_page]) {
                obj = obj.resource                
                for (let step of this.IS_display_path) {
                    obj = obj[step]
                }
                let htmlStr = this.parse_object(true, obj, 'IS')  

                // Imaging obj
                console.json(this.IS_display_path)
                if(this.IS_display_path == ['series' ]){}

                // 生成網頁
                this.IS_display = htmlStr
                

            } else {
                this.IS_display = nodata_template
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
            for (let i = 0; i < this.result_list.length; i++) {
                let bundle = this.result_list[i]
                let IS = this.get_resource(bundle.resource.entry, "ImagingStudy")
                let DR = this.get_resource(bundle.resource.entry, "DiagnosticReport")
                htmlStr += `<div class="card mb-2">
                <div class="card-header">
                    <h4 class="card-title mb-0">
                        <span>${i+1}. Resource ID：</span>
                        <button class="btn btn-link p-0 m-0" onclick="get_bundle(${i})">${bundle.resource.id}</button>
                    </h4>                                      
                </div>
                <div class="card-body">                  
                  <div>ImagingStudy<span class="badge rounded-pill bg-success ms-2">${IS.length}</span></div>
                  <div>DiagnosticReport<span class="badge rounded-pill bg-success ms-2">${DR.length}</span></div>
                </div>
              </div>`
            }
            this.result_display = htmlStr
        }
    },
    methods: {
        /* Search */
        async search_resource() {
            this.display_mode = 'search'
            this.result_display = loding_template
            console.log(`${config.burni_server_baseURL}/fhir/Bundle?_text=${this.search_text}`)
            //let searchURL = `${config.burni_server_baseURL}/fhir/Bundle?_text=${this.search_text}`
            let searchURL = "/bundle-searchset.json"
            await axios.get(searchURL)
                .then(res => {
                    if (res.data.entry) {
                        this.result_list = res.data.entry
                        this.result_display_result
                    }
                }).catch(err => {
                    alert("Can't get bundle")
                    console.log(err)
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
        get_bundle(idx) {
            this.IS_display = loding_template
            this.DR_display = loding_template
            this.display_mode = 'result'

            this.bundle = this.result_list[idx].resource
            console.json(this.bundle)
            if (entry = this.bundle.entry) {
                // Get resource
                this.IS_list = this.get_resource(entry, 'ImagingStudy')
                this.DR_list = this.get_resource(entry, 'DiagnosticReport')
                this.IS_display_refresh
                this.DR_display_refresh
            }
        },
        back_search(){
            this.display_mode = 'search'
            this.bundle = null
        }
    },
    async mounted() {
        try {
            this.search_resource()
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
