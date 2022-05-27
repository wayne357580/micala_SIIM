const es = require('./index');

class ESMyReport {
    constructor() {

    }

    /**
     * 
     * @param {object} options Options
     * @param {boolean} options.force Drop the index if true
     */
    async init(options = {}) {
        if (options.force) {
            await this.deleteIndex();
        }
        let isExist = await this.checkIndexExist();
        if (!isExist) {
            await this.createIndex();
        }
    }
    async createIndex() {
        try {
            let createRes = await es.esclient.indices.create({
                index: "my-report",
                body: {
                    "settings": {
                        "index": {
                            "max_ngram_diff": "20",
                            "number_of_shards": "1",
                            "max_shingle_diff": "5",
                            "analysis": {
                                "filter": {
                                    "stemmer": {
                                        "type": "stemmer",
                                        "language": "english"
                                    },
                                    "autocompleteFilter": {
                                        "max_shingle_size": "5",
                                        "min_shingle_size": "2",
                                        "type": "shingle"
                                    },
                                    "stopwords": {
                                        "type": "stop",
                                        "stopwords": [
                                            "_english_"
                                        ]
                                    }
                                },
                                "char_filter": {
                                    "my_char_filter": {
                                        "pattern": "[\r|\n|\r\n]",
                                        "type": "pattern_replace",
                                        "replacement": ""
                                    }
                                },
                                "analyzer": {
                                    "myStandard": {
                                        "filter": [
                                            "lowercase",
                                            "stopwords"
                                        ],
                                        "char_filter": [
                                            "html_strip"
                                        ],
                                        "type": "custom",
                                        "tokenizer": "standard"
                                    },
                                    "autocomplete": {
                                        "filter": [
                                            "lowercase",
                                            "autocompleteFilter"
                                        ],
                                        "char_filter": [
                                            "html_strip"
                                        ],
                                        "type": "custom",
                                        "tokenizer": "standard"
                                    },
                                    "nGram": {
                                        "filter": [
                                            "lowercase",
                                            "stemmer"
                                        ],
                                        "char_filter": [
                                            "my_char_filter"
                                        ],
                                        "tokenizer": "nGram"
                                    },
                                    "edgeGram": {
                                        "filter": [
                                            "lowercase",
                                            "stemmer"
                                        ],
                                        "char_filter": [
                                            "my_char_filter"
                                        ],
                                        "tokenizer": "edgeGram"
                                    },
                                    "charFilter": {
                                        "filter": [
                                            "lowercase"
                                        ],
                                        "char_filter": [
                                            "my_char_filter"
                                        ],
                                        "tokenizer": "standard"
                                    }
                                },
                                "tokenizer": {
                                    "nGram": {
                                        "token_chars": [
                                            "letter",
                                            "digit"
                                        ],
                                        "min_gram": "2",
                                        "type": "ngram",
                                        "max_gram": "20"
                                    },
                                    "edgeGram": {
                                        "token_chars": [
                                            "letter",
                                            "digit"
                                        ],
                                        "min_gram": "2",
                                        "type": "edge_ngram",
                                        "max_gram": "20"
                                    }
                                }
                            }
                        }
                    },
                    "mappings": {
                        "properties": {
                            "Records": {
                                "properties": {
                                    "FULLTEXT": {
                                        "type": "text",
                                        "fields": {
                                            "autocomplete": {
                                                "type": "text",
                                                "analyzer": "autocomplete",
                                                "fielddata": true
                                            },
                                            "default": {
                                                "type": "completion",
                                                "analyzer": "myStandard",
                                                "preserve_separators": true,
                                                "preserve_position_increments": true,
                                                "max_input_length": 50
                                            },
                                            "edge_ngram": {
                                                "type": "text",
                                                "analyzer": "edgeGram",
                                                "fielddata": true
                                            },
                                            "ngram": {
                                                "type": "text",
                                                "analyzer": "nGram",
                                                "fielddata": true
                                            }
                                        }
                                    }
                                }
                            },
                            "category": {
                                "properties": {
                                    "name": {
                                        "type": "text",
                                        "fields": {
                                            "keyword": {
                                                "type": "keyword",
                                                "ignore_above": 256
                                            }
                                        }
                                    },
                                    "value": {
                                        "type": "text",
                                        "fields": {
                                            "keyword": {
                                                "type": "keyword",
                                                "ignore_above": 256
                                            }
                                        }
                                    }
                                }
                            },
                            "pID": {
                                "type": "text",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword",
                                        "ignore_above": 256
                                    }
                                }
                            },
                            "sID": {
                                "type": "text",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword",
                                        "ignore_above": 256
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (createRes.statusCode == 200) {
                console.log("create 'my-report' index successful");
            }
        } catch (e) {
            console.error(e);
            console.error(JSON.stringify(e.meta.body));
            throw e;
        }
    }

    async checkIndexExist() {
        let isExist = await es.esclient.indices.exists({
            index: "my-report"
        });
        return isExist.body;
    }
    async deleteIndex() {
        try {
            await es.esclient.indices.delete({
                index: "my-report"
            });
        } catch (e) {
            throw e;
        }
    }
}

module.exports.ESMyReport = ESMyReport;