var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fileSchema = new Schema({
	fileId: {type:Number, index:1, required:true, unique:true},
    fileName: {type:String, required:true, unique:true},
    summery: {type: String, required:true},
    isEnable: {type: Boolean, required:true},
    isParsed: {type: Boolean, required:true}
}, {collection: 'files'});

var File = mongoose.model('File', fileSchema);
module.exports = File;