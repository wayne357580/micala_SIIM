const express = require('express');
const router = express.Router();
const path = require('path');


router.get('/autocomplete',function(req, res) {
    res.sendFile('autocompleteDemo.html', {
      root: __dirname + '../../../public/html'
    });
});


module.exports = router;