const es = require('./index');

class ESMyTestImagingStudy {
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
                index: "my-testimagingstudy",
                body: {
                    "settings": {
                        "index.mapping.total_fields.limit": 5000,
                        "index.max_ngram_diff": 20,
                        "index.max_shingle_diff": 5,
                        "analysis": {
                            "filter": {
                                "stemmer": {
                                    "type": "stemmer",
                                    "language": "english"
                                },
                                "radlex_keep_words_file": {
                                    "type": "keep",
                                    "keep_words_path": "term/radlexterm.txt"
                                },
                                "stopwords": {
                                    "type": "stop",
                                    "stopwords": ["_english_"]
                                },
                                "autocompleteFilter": {
                                    "type": "shingle",
                                    "min_shingle_size": 2,
                                    "max_shingle_size": 5
                                }
                            },
                            "tokenizer": {
                                "edgeGram": {
                                    "type": "edge_ngram",
                                    "min_gram": 3,
                                    "max_gram": 15,
                                    "token_chars": ["letter"]
                                },
                                "nGram": {
                                    "type": "ngram",
                                    "min_gram": 2,
                                    "max_gram": 20,
                                    "token_chars": [
                                        "letter",
                                        "digit"
                                    ]
                                }
                            },
                            "char_filter": {
                                "my_char_filter": {
                                    "type": "pattern_replace",
                                    "pattern": "[\r|\n|\r\n]",
                                    "replacement": ""
                                }
                            },
                            "analyzer": {
                                "radlexkeep": {
                                    "filter": [
                                        "stopwords",
                                        "lowercase",
                                        "kstem",
                                        "stemmer",
                                        "autocompleteFilter",
                                        "radlex_keep_words_file"
                                    ],
                                    "tokenizer": "standard"
                                },
                                "forRadlex": {
                                    "filter": [
                                        "lowercase",
                                        "kstem",
                                        "stemmer"
                                    ],
                                    "tokenizer": "standard"
                                },
                                "radlexkeyword": {
                                    "filter": [
                                        "stopwords",
                                        "lowercase",
                                        "autocompleteFilter",
                                        "radlex_keep_words_file"
                                    ],
                                    "tokenizer": "standard"
                                },
                                "autocomplete": {
                                    "filter": ["lowercase", "autocompleteFilter"],
                                    "char_filter": ["html_strip"],
                                    "type": "custom",
                                    "tokenizer": "standard"
                                },
                                "edgeGram": {
                                    "filter": ["lowercase", "stemmer", "stopwords"],
                                    "tokenizer": "edgeGram"
                                },
                                "nGram": {
                                    "filter": ["lowercase", "stemmer", "stopwords"],
                                    "char_filter": ["my_char_filter"],
                                    "tokenizer": "nGram"
                                },
                                "myStandard": {
                                    "filter": ["lowercase", "stemmer"],
                                    "char_filter": ["html_strip"],
                                    "type": "custom",
                                    "tokenizer": "standard"
                                }
                            }
                        }
                    },
                    "mappings": {
                        "dynamic_templates": [
                            {
                                "standard": {
                                    "match_mapping_type": "string",
                                    "match": "*",
                                    "mapping": {
                                        "type": "text",
                                        "fields": {
                                            "edgeGram": {
                                                "type": "text",
                                                "analyzer": "edgeGram"
                                            },
                                            "keyword": {
                                                "type": "keyword"
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        "properties": {
                            "report": {
                                "properties": {
                                    "Records": {
                                        "properties": {
                                            "FULLTEXT": {
                                                "type": "text",
                                                "fields": {
                                                    "autocomplete": {
                                                        "type": "text",
                                                        "fielddata": true,
                                                        "analyzer": "autocomplete"
                                                    },
                                                    "ngram": {
                                                        "type": "text",
                                                        "fielddata": true,
                                                        "analyzer": "nGram"
                                                    },
                                                    "edge_ngram": {
                                                        "type": "text",
                                                        "fielddata": true,
                                                        "analyzer": "edgeGram"
                                                    },
                                                    "forRadlex": {
                                                        "type": "text",
                                                        "term_vector": "with_positions_offsets",
                                                        "analyzer": "forRadlex",
                                                        "fielddata": true
                                                    },
                                                    "keep": {
                                                        "type": "text",
                                                        "analyzer": "radlexkeep",
                                                        "fielddata": true
                                                    },
                                                    "keepkeyword": {
                                                        "type": "text",
                                                        "analyzer": "radlexkeyword",
                                                        "fielddata": true
                                                    },
                                                    "default": {
                                                        "type": "completion",
                                                        "analyzer": "myStandard"
                                                    },
                                                    "keyword": {
                                                        "type": "keyword"
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
                                    },
                                    "category": {
                                        "type": "nested"
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (createRes.statusCode == 200) {
                console.log("create 'my-testimagingstudy' index successful");
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async checkIndexExist() {
        let isExist = await es.esclient.indices.exists({
            index: "my-testimagingstudy"
        });
        return isExist.body;
    }
    async deleteIndex() {
        try {
            await es.esclient.indices.delete({
                index: "my-testimagingstudy"
            });
        } catch (e) {

        }
    }
}

module.exports.ESMyTestImagingStudy = ESMyTestImagingStudy;