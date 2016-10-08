'use strict'
var fs = require('fs');
var Promise = require('promise');
var lineReader = require('line-reader');
var mongoose = require('mongoose');
mongoose.connect("mongodb://admin:1234@ds153735.mlab.com:53735/search_engine");

var Term = require('./term');
var File = require('./file');


var filesContent = new Map();
var stopList = ["the", "a", "there", "did", "to", "was", "is", "and"];

module.exports = class ParseManager {
    
        
    parseFiles(fileIds, callback) {
        
        var ids = getFileIds(fileIds);
        var finalMap = new Map();
        for (var i=0; i<ids.length; i++) {
            
            //Only if the file is not parsed
            var filePath = "/Users/morkasus/Desktop/SearchEngine 2/web_service/files/file" + ids[i] + ".txt";
            parseFile(filePath, ids[i], function(termMap) {
                //console.log(termMap.size);
                updateFinalMap(finalMap, termMap);
            });
            ///////////////////////////////
            
            File.findOneAndUpdate({ fileId: ids[i] }, { isParsed: true }, function(err, file) {
              if (err) throw err;
              // we have the updated user returned to us
              //console.log(file);
            });
            
        }
        
        insertToDb(finalMap, function() {
            callback(ids);
        });
    }
    

    getAllFiles(callback) {
        File.find({}, function(err, files){ 
            if (err) throw err;
            callback(files);
        });
    }
    
    
    disableFile(fileId, callback) {
        File.findOneAndUpdate({ fileId: fileId }, { isEnable: false }, function(err, file) {
          if (err) throw err;
          callback(file);
        });
    }
    
    enableFile(fileId, callback) {
        File.findOneAndUpdate({ fileId: fileId }, { isEnable: true }, function(err, file) {
          if (err) throw err;
          callback(file);
        });
    }
    
    
    searchTerm(term, callback) {
        
        //var operator = getOperator(term);
        var operator = "!";
//        var terms;
//        
//        if(operator != null) {
//            terms = getTerms(term, operator);
//        }
        
        if(operator === "&") {
            
            Term.find({ term : {'$ne':term }}, function(err, term){
                if (err) throw err;
                callback(term); 
            });
            
        } else if(operator === "|") {
            
            Term.find({ term : {'$ne':term }}, function(err, term){
                if (err) throw err;
                callback(term); 
            });
            
        } else if(operator === "!") {
            
            Term.findOne({ term : term}, function(err, term){
                if (err) throw err;
                var ids = [];
                for(var i=0; i < term.files.length; i++) {
                    ids.push(term.files[i].fileId)
                }
                File.find({ fileId: { $nin : ids } }).where("isParsed", true).exec(function(err, files) {
                      if (err) throw err;
                      callback(files);
                });                
            });
            
        } else {
            //only one term
            term = term.toLowerCase();
            
            var returnData;
            Term.findOne({ term : term}, function(err, term){
                if (err) throw err;
                var ids = [];
                for(var i=0; i < term.files.length; i++) {
                    ids.push(term.files[i].fileId)
                }
                File.find({ fileId: { $in : ids } }, function(err, files) {
                      if (err) throw err;
                      callback(createReturnData(term.files, files));
                });                
            });
            
        }
        
        
    }

}

function getFileIds(fileIds) {
    var ids = [];
    for(var i=0; i<fileIds.length; i++) {
        ids.push(parseInt(fileIds[i]));
    }
    return ids;
}

function insertToDb(termMap, callbackInsert) {
    //get all words;
   
    Term.find({}, function(err, terms){
        
        if (terms != undefined || terms.length == 0) {
            console.log("termsLength : " + terms.length);
            for(var i=0; i<terms.length; i++) {
                var value = termMap.get(terms[i].term);
                if(termMap.has(terms[i].term)) {
                    terms[i].reapet++;
                    for(var j=0; j < value.files.length; j++) {
                        
                        terms[i].files.push({
                            "fileId" : value.files[j].fileId,
                            "reapet" : value.files[j].reapet,
                            "positions" : value.files[j].positions
                        });
                        
                    }
                    
                    terms[i].save(function(err) {
                        if (err) throw err;
                        console.log('Term successfully updated!');
                    });

                    termMap.delete(terms[i].term);
                }
            }
        }
        
        getBunchOfTerms(termMap, function(rawDocuments){
            Term.collection.insert(rawDocuments, function (err, docs){ 
                callbackInsert();
            });
        })
    });

}

function parseFile(filePath, fileId, parseCallBack) {
    
    var termMap = new Map();
    var lines = fs.readFileSync(filePath , 'utf8').toString().split('\n');
    filesContent.set(fileId, lines);
    for(var i=0; i<lines.length; i++) {
        var words = lines[i].split(' ');
        for(var j=0; j<words.length; j++) {
            if (stopList.indexOf(words[j]) > -1) continue;
            var term = words[j].toLowerCase();
            if (termMap.has(term)) {
                var updateTerm = termMap.get(term);
                updateTerm.reapet++;
                updateTerm.positions.push({line: i, offset: j});
                termMap.set(term, updateTerm);
            } 
            else {
                termMap.set(term, 
                    { 
                        "fileId" : fileId,
                        "reapet" : 1, 
                        positions: [
                             { line: i, offset: j}
                         ]
                    }
                );
            }
        }
    }
    parseCallBack(termMap);
}


function updateFinalMap(finalMap, termMap) {
        
    termMap.forEach(function(value, key) {

        if(finalMap.has(key)) {
            
            var updateTerm = finalMap.get(key);
            updateTerm.reapet++;
            updateTerm.files.push(value)
            finalMap.set(key, updateTerm);
            
        } else {

            finalMap.set(key, 
                {       
                    "reapet" : 1,
                    "files" : [ value ]
                }
            );
        }
    
    }, termMap)
    

    finalMap.forEach(function(value, key) {
              console.log(key + " = " + value.reapet);
            }, finalMap)

}


function saveTerm(termDoc, callbackSaveTerm) {
    termDoc.save(function (err) {
        if(err) {
            callbackSaveTerm(false);
        } else callbackSaveTerm(true);
    });
}

function getBunchOfTerms(termMap, callbackGetBunch) {
    var rawDocuments = [];
    for(var key of termMap.keys()) {
        var value = termMap.get(key);
        var newTerm = {
            "term": key,
            "reapet": value.reapet,
            "files": value.files
        };
        rawDocuments.push(newTerm);
    }
    callbackGetBunch(rawDocuments);
}

function getOperator(term) {
    
    

}

function createReturnData(termFiles, files) {
    
    var dataArr = [];
    for(var i=0; i<termFiles.length; i++) {
        for(var j=0; j<files.length; j++) {
            if( termFiles[i].fileId === files[j].fileId) {
                var data = {};
                data.termInfo = termFiles[i];
                data.fileInfo = files[j];
                dataArr.push(data);
            }
        }
    }
    return dataArr;
}
