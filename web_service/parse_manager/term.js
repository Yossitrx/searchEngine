var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var termSchema = new Schema({
	term: {type:String, index:1, required:true, unique:true},
    reapet: {type: Number, required:true},
	files : [
        {
            fileId : {type: Number, required:true},
            reapet: {type: Number, required:true},
            positions : [
                {
                    line: {type: Number, required:true},
                    offset: {type: Number, required:true}
                }
            ]
        }
    ]
}, {collection: 'terms'});

var Term = mongoose.model('Term', termSchema);
module.exports = Term;