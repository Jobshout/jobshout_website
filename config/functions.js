	/**********************************************************************
	*  Author: Neha Kapoor (neha@jobshout.org)
	*  Project Lead: Balinder WALIA (bwalia@jobshout.org)
	*  Project Lead Web...: https://twitter.com/balinderwalia
	*  Name..: Jobshout Server NodeJS
	*  Desc..: Jobshout Server (part of Jobshout Suite of Apps)
	*  Web: http://jobshout.org
	*  License: http://jobshout.org/LICENSE.txt
	**/

	/**********************************************************************
	*  functions.js contain all the functions required for requests
	**/
	
	var init = require('./init');
	var mongodb=init.mongodb;

var self = module.exports = 
{
  	// These functions which will be called in the main file, which is server.js
  	returnFindOneByMongoID : function (db, collectionName, search_id, cb){
		var outputObj = new Object();
		db.collection(collectionName).findOne({_id: new mongodb.ObjectID(search_id)}, function(err, document_details) {
			if (err) {
				outputObj["error"]   = err;
				cb(outputObj);
      		} else if (document_details) {
      			outputObj["aaData"]   = document_details;
				cb(outputObj);
     		}
		});
	},
	
	nowTimestamp : function (){
		var timeStampStr=Math.round(new Date().getTime()/1000)
		return timeStampStr;
	},
	
	returnNavigation : function (db, cb){
		db.collection('bookmarks').find({"uuid_system" : init.system_id, "status": { $in: [ 1, "1" ] } , categories: { $in: [ 'footer-nav', 'top-navigation' ] }}).sort( { order_by_num: 1 } ).toArray(function(err, tokens_result) {
			if(err) return cb(null)
			cb(tokens_result);
		});
	},
	guid : function () {
  		function s4() {
    		return Math.floor((1 + Math.random()) * 0x10000)
      		.toString(16)
      		.substring(1);
  		}
  		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	},
	
searchForTemplate : function (db, navigationData, req_params_id, res) {
	db.collection('templates').findOne({code: req_params_id, uuid_system : init.system_id, status: { $in: [ 1, "1" ] } }, function(templateErr, returnTemplateContent) {
		if (returnTemplateContent) {
      		var templateContentStr = returnTemplateContent.template_content;
      		self.templateProcessTokens(db, templateContentStr, function(responseStr) {
      			res.render('template', {
       				drawTemplate: responseStr,
       				navigation : navigationData
    			});
			});
    	} else {
       		res.redirect('/not_found');
    	}
   	});
},

findTokensListInTemplate : function (templateContentStr) {
	var findTokensStr= '', searchParaCount=4, tempContentStr=templateContentStr;
	var findTokenStartingPos = tempContentStr.indexOf("<*--");

    if(tempContentStr!="" && findTokenStartingPos>=1){
    	var findTokenEndingPos = tempContentStr.indexOf("--*>");
      	var tokenStr=tempContentStr.substring(findTokenStartingPos+searchParaCount, findTokenEndingPos);
		if(findTokensStr!=""){
			findTokensStr+=","+tokenStr.trim();
		}else{
      		findTokensStr+=tokenStr.trim();
      	}
      	tempContentStr=tempContentStr.substring(findTokenEndingPos+searchParaCount);

      	if(tempContentStr!=""){
      		if(findTokensStr!=""){
				findTokensStr+=","+self.findTokensListInTemplate(tempContentStr);
			}else{
      			findTokensStr+=self.findTokensListInTemplate(tempContentStr);
      		}
      	}
    }	
    if(findTokensStr.charAt(findTokensStr.length - 1)==","){
    	findTokensStr = findTokensStr.substring(0, findTokensStr.length - 1);
    }
    return findTokensStr;					
},

escapeRegExp : function (str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
},

templateProcessTokens : function (db, templateContentStr, cb){
	var outputResponseStr=templateContentStr;
	var listOfTokensStr= self.findTokensListInTemplate(outputResponseStr);
    if(listOfTokensStr!=""){
    	var tokensArr = listOfTokensStr.split(',');
      	db.collection('tokens').find({ 'code': { $in: tokensArr }, status: { $in: [ 1, "1" ] }, uuid_system : init.system_id }, {'code' : 1,'token_content' : 1}).toArray(function(tokensErr, tokensResult) {
    		if (tokensResult && tokensResult.length>0){
      			for(var j=0; j<tokensResult.length; j++){
      				var foundTokenStr = self.escapeRegExp("<*--"+tokensResult[j].code+"--*>");
      				outputResponseStr=outputResponseStr.replace(new RegExp(foundTokenStr, 'g'), tokensResult[j].token_content);
      			}
      			if(outputResponseStr==templateContentStr){
      				cb(outputResponseStr);
      			}else{
      				self.templateProcessTokens(db, outputResponseStr, function(responseStr) {
      					cb(responseStr);
					});
				}
      		} else {	
      			db.collection('tokens').find({ 'code': { $in: tokensArr }, status: { $in: [ 1, "1" ] }, shared_systems : { $in: [init.system_id] } }, {'code' : 1,'token_content' : 1}).toArray(function(tokensErr, tokensResult) {
    				if (tokensResult && tokensResult.length>0){
      					for(var j=0; j<tokensResult.length; j++){
      						var foundTokenStr = self.escapeRegExp("<*--"+tokensResult[j].code+"--*>");
      						outputResponseStr=outputResponseStr.replace(new RegExp(foundTokenStr, 'g'), tokensResult[j].token_content);
      					}
      				}
      				if(outputResponseStr==templateContentStr){
      					cb(outputResponseStr);
      				}else{
      					self.templateProcessTokens(db, outputResponseStr, function(responseStr) {
      						cb(responseStr);
						});
					}
				});
      		}	
      	});
    } else {
    	cb(outputResponseStr);
    }
}
};