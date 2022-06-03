const loding_template = `<img src="../images/loading.gif"></div>`
const nodata_template = `<h3>No data<h3/>`;

let app = new Vue({
    el: '#app',
    data() {
        return {
            result_display: nodata_template,
            search_res_list: []            
        }
    },
    created: function () {

    },
    computed: {
        refresh_result() {
            let htmlStr = ""
            for(let bundle of this.search_res_list){
                let resource = bundle.resource
                let IS = this.get_resource(resource.entry, "ImagingStudy")
                let DR = this.get_resource(resource.entry, "DiagnosticReport")               
                htmlStr+=`<div class="card mb-2">
                <div class="card-header text-start">
                <h5 class="mb-0">Resource ID：<a>${bundle.resource.id}</a>
                </h5>
                </div>
                <div class="card-body">
                    ${bundle.fullUrl}
                </div>
              </div>`
            }
            this.result_display = htmlStr
        }
    },
    methods: {
        get_resource(arr, resource) {
            return arr.filter(r => { return r.resource.resourceType == resource })
        },
        async searchBudle(searchStr) {
            this.result_display = loding_template
            //let searchURL = `${config.burni_server_baseURL}/fhir/Bundle?_text=${searchStr}`
            let searchURL = "/bundle-searchset.json"
            await axios.get(searchURL)
                .then(res => {
                    if (res.data.entry) {
                        this.search_res_list = res.data.entry
                        this.refresh_result
                    }
                }).catch(err => {
                    alert("Can't get bundle")
                    console.log(err)
                })
        }
    },
    async mounted() {
        try {
            let searchStr = parse_queryStr(decodeURIComponent(location.href), '_text')
            if (searchStr) {
                this.searchBudle(searchStr)
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


function parse_queryStr(url, keyword) {
    if (url.indexOf('?') != -1) {
        let querys = url.split('?')[1].split('&');
        for (let query of querys) {
            let pos = query.indexOf('=')
            if (query.slice(0, pos) == keyword) {
                return query.slice(pos + 1)
            }
        }
    }
    return null
}
