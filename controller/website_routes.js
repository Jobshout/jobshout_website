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
	*  website_routes.js handles the http requests
	**/
	
var initFunctions = require('../config/functions');	
var Grid = require('gridfs-stream');

module.exports = function(init, app, db){
	var mongodb=init.mongodb;
	var gfs = Grid(db, mongodb);
	
	var navigationCategoriesArr = new Array('footer-nav', 'top-navigation');
//unsubscribe
app.get('/unsubscribe', returnNavigation, function(req, res) {
	var email_to='', contact_uuid= '', uuid='', unsubscribed=1, status="unsubscribe";
	if(req.query.email_to){
		email_to=req.query.email_to;
	}
	if(req.query.contact_uuid){
		contact_uuid=req.query.contact_uuid;
	}
	if(req.query.uuid){
		uuid=req.query.uuid;
	}
	if(req.query.s){
		unsubscribed=req.query.s;
	}
	if(unsubscribed==0){
		status="subscribe";
	}
	if(email_to!="" && uuid!=""){
		var queryStr='email_to='+email_to+'&contact_uuid='+contact_uuid+'&uuid='+uuid+'&s=0';
		db.collection('mailing_preferences').findOne({"email_address" : email_to, "uuid" : uuid, "uuid_system" : init.system_id}, function(err, foundRecord) {
			if (typeof foundRecord !== 'undefined' && foundRecord !== null && foundRecord.uuid!="") {
    	  		var updateContent=new Object();
    	  		updateContent["modified"]=initFunctions.nowTimestamp();
    	  		updateContent["uuid"]=foundRecord.uuid;
    	  		updateContent["contact_uuid"]=foundRecord.contact_uuid;
    	  		updateContent["email_address"]=email_to;
    	  		updateContent["unsubscribed"]=unsubscribed;
    	  		updateContent["status"]=status;
    	  		updateContent["uuid_system"]=init.system_id;
    	  		db.collection('mailing_preferences').update({"email_address" : email_to, "uuid" : uuid, "uuid_system" : init.system_id}, updateContent, (updateErr, result) => {
    	  			var tokenFlag=false;
    	  			if(result){
    	  				tokenFlag=true;
    	  			}
    	  				res.render('unsubscribe', {
      	 					navigation : req.navigation,
      	 					tokenBool : tokenFlag,
      	 					emailAddress : email_to,
      	 					queryString : queryStr,
      	 					unsubscribed : unsubscribed
       					});
    	  		});
    	  	}else{
    	  		var addContent=new Object();
    	  		addContent["modified"]=initFunctions.nowTimestamp();
    	  		addContent["uuid"]=uuid;
    	  		addContent["contact_uuid"]=contact_uuid;
    	  		addContent["unsubscribed"]=unsubscribed;
    	  		addContent["email_address"]=email_to;
    	  		addContent["status"]=status;
    	  		addContent["uuid_system"]=init.system_id;
    	  		
    	  		db.collection("mailing_preferences").save(addContent, (insertErr, result) => {
    	  			var tokenFlag=false;
    	  			if(result){
    	  				tokenFlag=true;
    	  			}
    	  				res.render('unsubscribe', {
      	 					navigation : req.navigation,
      	 					tokenBool : tokenFlag,
      	 					emailAddress : email_to,
      	 					queryString : queryStr,
      	 					unsubscribed : unsubscribed
       					});
    			});
    	  	}
    	});
    }else{
    	res.render('unsubscribe', {
      		navigation : req.navigation,
      		tokenBool : false
       	});
    }
})

//search results page
app.get('/search-results', function(req, res) {
	var myObj = new Object();
	var itemsPerPage = 10, pageNum=1;
	if(req.query.start){
		pageNum=parseInt(req.query.start);
	}
	if(req.query.limit){
		itemsPerPage=parseInt(req.query.limit);
	}
	if(pageNum==0){
		pageNum=1;
	}
	var type = req.query.type, data='', truncate = 250;
	var query="{}", fetchFieldsObj="{}";
	if(req.query.s){
		var searchStr = req.query.s;
		var regex = new RegExp(searchStr, "i");
		
		if(type=="site"){
			query= '{ "status": { $in: [ 1, "1" ]},'
		}else{
			query= '{ "Type" : "'+type+'", "status": { $in: [ 1, "1" ] },  ';
		}
		query+=" '$text': { '$search': '"+req.query.s+"' } ";
		/**query+= '$or:[';
		query+="{'Document' : "+regex+" }, {'Code' :  "+regex+"}, {'Body' :  "+regex+" }, {'MetaTagDescription' :  "+regex+" }";
		query+=']';**/
		query+=", $or: [ { 'uuid_system' : { $in: ['"+init.system_id+"'] } }, { 'shared_systems': { $in: ['"+init.system_id+"'] } } ] ";
		query+='}';
		fetchFieldsObj='{"Document" : 1, "Code" : 1, "Body" : 1}';
	}	else	{
		query= '{ "Type" : "'+type+'", "status": { $in: [ 1, "1" ] }';
		query+=", $or: [ { 'uuid_system' : { $in: ['"+init.system_id+"'] } }, { 'shared_systems': { $in: ['"+init.system_id+"'] } } ] ";
		query+='}';
	}
		
		eval('var obj='+query);
		eval('var fetchFieldsobj='+fetchFieldsObj);
		db.collection('documents').find(obj, fetchFieldsobj).skip(pageNum-1).limit(itemsPerPage).toArray(function(err, document) {
			if (document) {
      			db.collection('documents').find(obj).count(function (e, count) {
      				myObj["total"]   = count;
      				myObj["aaData"]   = document;
					res.send(myObj);
     			});
			}else{
      			myObj["total"]   = 0;
      			myObj["error"]   = 'not found';
				res.send(myObj);
			}
      	});
});

//404 page
	app.get('/not_found', returnNavigation, function(req, res) {
		res.render('not_found', {
      	 	navigation : req.navigation  
       	});
	});

//save contact
app.post('/contact/save', (req, res) => {
	var link="/contact-us";
	var postJson=req.body;
	postJson.created=initFunctions.nowTimestamp();
	postJson.uuid_system=init.system_id;
    db.collection("website_enquiries").save(postJson, (err, result) => {
		if (err){
    		link+="?error=Sorry, some problem occurred while submitting your request!";
    		res.redirect(link)
    	}else{ 
    		link+="?success=Thanks, your request has been sent successfully!";
    		var	subjectStr = init.system_name+" has new enquiry";
    		if(req.body.subject){
    			var subjectStr=req.body.subject
    		}
    		var insertEmail=new Object();
			insertEmail["uuid_system"]=init.system_id;
			insertEmail["sender_name"]=req.body.name;
			insertEmail["sender_email"]=req.body.email;
			insertEmail["subject"]=subjectStr;
			insertEmail["body"]=req.body.message;
			insertEmail["created"]=initFunctions.nowTimestamp();
			insertEmail["modified"]=initFunctions.nowTimestamp();
			insertEmail["recipient"]=init.recipientStr;
			insertEmail["status"]=0;
			db.collection("email_queue").save(insertEmail, (err, e_result) => {
				res.redirect(link);
			})
    	} 	
  	});	
})

//save blog comment
app.post('/saveblogcomment', (req, res) => {
	var postJson=req.body;
	postJson.created=init.nowTimestamp;
	postJson.modified=init.nowTimestamp;
	postJson.status=0;
	postJson.uuid=initFunctions.guid();
	var blogID= req.body.blog_uuid;
	if(blogID!=""){
		var mongoIDField= new mongodb.ObjectID(blogID);
		var table_nameStr="documents";
		initFunctions.returnFindOneByMongoID(db, table_nameStr, blogID, function(resultObject) {
			var myObj = new Object();
			if(resultObject.aaData){
				var documentData=resultObject.aaData;
				var insertEmail=new Object();
    			var nameStr=req.body.name;
    			postJson.uuid_system=init.system_id;
    			insertEmail["uuid_system"]=init.system_id;
				insertEmail["sender_name"]=nameStr;
				insertEmail["sender_email"]=req.body.email;
				insertEmail["subject"]=nameStr+" has posted a comment";;
				insertEmail["body"]=req.body.comment;
				insertEmail["created"]=initFunctions.nowTimestamp();
				insertEmail["modified"]=initFunctions.nowTimestamp();
				insertEmail["recipient"]=init.recipientStr;
				insertEmail["status"]=0;
				if(typeof(documentData.BlogComments)=="string"){
	            	db.collection(table_nameStr).update({_id:mongoIDField}, { $set: { "BlogComments": new Array(postJson) } }, (err, result) => {
    	                if(result){
                    	    db.collection("email_queue").save(insertEmail, (err, e_result) => {
                        		myObj["success"]   = "Thanks your comment has been posted OK and will be visible soon!";
                                res.send(myObj);
                            });
                        }else{
                        	myObj["error"]   = "Error posting comment. Please try again later!!!";
                            res.send(myObj);
                        }
                    });
        		} else {
					db.collection(table_nameStr).update({_id:mongoIDField}, { $push: { "BlogComments": postJson } }, (err, result) => {
                    	if(result){
                        	db.collection("email_queue").save(insertEmail, (err, e_result) => {
                            	myObj["success"]   = "Thanks your comment has been posted OK and will be visible soon!";
                                res.send(myObj);
                            })
                        }else{
                            myObj["error"]   = "Error posting comment. Please try again later!!!";
                            res.send(myObj);
                        }
                    });
                }
			}else{
				myObj["error"]   = "Error posting comment. Please try again later!!!";
				res.send(myObj);
			}	
  		});	
  	}
})

// fetch_tokens_content : to fetch tokens content
app.get('/fetch_tokens_content', function(req, res) {
	var myObj = new Object();
	if(req.query.code && req.query.code!=""){
		var obj = req.query.code;
		obj = obj.replace(/'/g, '"');
		obj = JSON.parse(obj);
		db.collection('tokens').find({ 'code': { $in: obj }, status: { $in: [ 1, "1" ] } }, {'code' : 1,'token_content' : 1}).toArray(function(avaErr, documents) {
      		myObj["aaData"]   = documents;
      		res.send(myObj);
   		});
    }	else{
    	myObj["error"]   = 'Please pass the parameter!';
      	res.send(myObj);
    }
});

//fetch tweets
app.get('/fetchTweets', function(req, res) {
	db.collection('system_lists').findOne({code: "twitter-details"}, function(err, listDetails) {
		var consumer_key_str = process.env.TWITTER_CONSUMER_KEY;
  		var consumer_secret_str = process.env.TWITTER_CONSUMER_SECRET;
  		var access_token_key_str = process.env.TWITTER_ACCESS_TOKEN_KEY;
  		var access_token_secret_str = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  		
		if(listDetails && listDetails.list && listDetails.list.length>0){
			var listArr = listDetails.list;
			for(var i=0; i<listArr.length; i++){
				if(listArr[i].label=="CONSUMER_SECRET")	{
					consumer_secret_str = listArr[i].value;
				} else if(listArr[i].label=="CONSUMER_KEY"){
					consumer_key_str = listArr[i].value;
				}	else if(listArr[i].label=="ACCESS_TOKEN_KEY"){
					access_token_key_str = listArr[i].value;
				}	else if(listArr[i].label=="ACCESS_TOKEN_SECRET"){
					access_token_secret_str = listArr[i].value;
				}
			}
		}
		var tweetsObj = new Object();
		var Twitter = require('twitter');
		var client = new Twitter({
  			consumer_key: consumer_key_str, consumer_secret: consumer_secret_str,	access_token_key: access_token_key_str,	access_token_secret: access_token_secret_str
		});
		var params = {screen_name : "jobshoutnews", count: '3', trim_user : "true", "exclude_replies" : "true"};
		client.get('statuses/user_timeline', params, function(error, tweets, response) {
  			if (!error) {
    			tweetsObj["aaData"]   = tweets;
			} else	{
  				tweetsObj["error"]   = "Please specify your email address!";
			}
  			res.send(tweetsObj);
		});
	});
});

//api_fetch_navigation
app.get('/get_category_lists', function(req, res) {
	var responseObj = new Object();
	if(req.query.category && req.query.category!=""){
		var catArr = new Array(req.query.category);
		initFunctions.returnBookmarks(db, catArr, new Array(), false, function(resultNav) {
			responseObj["aaData"]   = resultNav;
      		res.send(responseObj);
   		});
   	}else{
   		responseObj["error"]   = 'Please pass the category!';
      	res.send(responseObj);
   	}
});

//api_fetch_navigation
app.get('/api_fetch_navigation', returnNavigation, function(req, res) {
	res.send(req.navigation);
});

//index page
app.get('/', function(req, res) {
	initFunctions.searchForTemplate(db, 'index', res, navigationCategoriesArr);
});

//fetch uploaded file content
app.get('/file/:filename', function(req, res){
        /** First check if file exists */
        gfs.files.find({'metadata.uuid': req.params.filename}).toArray(function(err, files){
            if(!files || files.length === 0){
                return res.status(404).json({
                    responseCode: 1,
                    responseMessage: "error"
                });
            }

            /** create read stream */
            var readstream = gfs.createReadStream({
            	filename: files[0].filename
            });

            /** set the proper content type */
            res.set('Content-Type', files[0].contentType)                                                                                                                      

            /** return response */
            return readstream.pipe(res);
        });
});
//content page or template
app.get('/:id', function(req, res) {
      db.collection('documents').findOne({Code: req.params.id, uuid_system : init.system_id}, function(err, document) {
		if (document) {
			initFunctions.returnBookmarks(db, navigationCategoriesArr, document.tags, true, function(resultNav) {
				res.render('content', {
       				document_details: document,
       				navigation : resultNav 
    			});
    		});
    	} else {
    		db.collection('documents').findOne({Code: req.params.id, shared_systems : { $in: [init.system_id] }}, function(err, document) {
				if (document) {
					initFunctions.returnBookmarks(db, navigationCategoriesArr, document.tags, true, function(resultNav) {
						res.render('content', {
       						document_details: document,
       						navigation : resultNav 
       					});
    				});
    			} else {
       				initFunctions.searchForTemplate(db, req.params.id, res, navigationCategoriesArr);
    			}
    		});
    	}
    });
});

function returnNavigation (req, res, next) {
	initFunctions.returnBookmarks(db, navigationCategoriesArr, new Array(), true, function(resultNav) {
		req.navigation=resultNav;
		next();
   	});
}

}