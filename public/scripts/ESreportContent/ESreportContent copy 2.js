const loding_template = `<img src="../images/loading.gif"></div>`
const nodata_template = `<h3>No data<h3/>`;


let app = new Vue({
    el: '#app',
    data() {
        return {
            search_type: 'All',
            bundle: null,
            IS_display: loding_template,
            IS_list: [],
            IS_list_path: [],
            IS_list_page: 0,
            DR_display: loding_template,
            DR_list: [],
            DR_list_page: 0,
        }
    },
    computed: {
        IS_display_refresh() {
            if (page = this.IS_list[this.IS_list_page]) {
                this.IS_display = page
            } else {
                this.IS_display = nodata_template
            }
        },
        DR_display_refresh() {
            if (page = this.DR_list[this.DR_list_page]) {
                this.DR_display = page
            } else {
                this.DR_display = nodata_template
            }
        }
    },
    methods: {
        async parse_IS(rows) {
            this.IS_display = loding_template
            this.IS_list = []

            for (let row of rows) {
                this.IS_list.push(parse_object(true, row.resource))
            }
            this.IS_list_page = 0
            this.IS_display_refresh
        },
        async parse_DR(rows) {
            this.DR_display = loding_template
            this.DR_list = []

            for (let row of rows) {
                this.DR_list.push(parse_object(true, row.resource))
            }
            this.DR_list_page = 0
            this.DR_display_refresh
        },
        get_resource(arr, resource) {
            return arr.filter(r => { return r.resource.resourceType == resource })
        },
        change_page(targetList, action) {
            if (targetList == 'IS') {
                this.IS_list_page = Math.min(Math.max(0, this.IS_list_page + action), this.IS_list.length - 1)
            } else if (targetList == 'DR') {
                this.DR_list_page = Math.min(Math.max(0, this.DR_list_page + action), this.DR_list.length - 1)
            }
        },
        fetchObject(obj, path) {
            for (let step of path) {
                obj = obj[step]
            }
            return obj
        }
    },
    async mounted() {
        try {
            // Get bundle
            let bundle_url = '/public/bundle.json'
            await axios.get(bundle_url)
                .then(res => {
                    this.bundle = res.data
                    if (entry = this.bundle.entry) {
                        let IS_array = this.get_resource(entry, 'ImagingStudy')
                        let DR_array = this.get_resource(entry, 'DiagnosticReport')
                        this.parse_IS(IS_array)
                        this.parse_DR(DR_array)
                    }

                }).catch(err => {
                    console.log(err)
                })
        } catch (e) {
            console.log(e);
        }
    }
})

console.json = (text) => {
    console.log(JSON.parse(JSON.stringify(text)))
}

function parse_object(isBaseTable, obj) {
    if (isBaseTable) {
        var htmlStr = `<table class="table table-bordered align-middle text-center">`
    } else {
        var htmlStr = `<table class="table table-sm table-bordered table-hover align-middle text-center m-2">`
    }
    htmlStr += `<thead class='table-light'><tr><th scope="col">Column</th><th scope="col">Value</th></tr></thead>`
    htmlStr += `<tbody>`
    for (let key in obj) {
        let value = obj[key]
        if (typeof value == 'object') {
            if (value.length == undefined) {
                // is Object
                //htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-1">${parse_object(false, value)}</td></tr>`
                htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-1">${value}</td></tr>`
            } else {
                // is List                
                //htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}<span class="badge rounded-pill bg-info ms-2">${value.length}</span></th><td class="w-75 p-1">${parse_list(key, value)}</td></tr>`
                htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-1">${value}</td></tr>`
            }
        } else {
            htmlStr += `<tr><th class="w-25">${firstUpperCase(key)}</th><td class="w-75 p-1">${value}</td></tr>`
        }
    }
    htmlStr += `</tbody></table>`
    return htmlStr
}

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
          <div class="accordion-body overflow-scroll"  style='max-height: 500px'>
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

function firstUpperCase(s) {
    return s[0].toUpperCase() + s.slice(1)
}