(function() {
   			$('<i id="back-to-top"></i>').appendTo($('body'));
			$(window).scroll(function() {
				if($(this).scrollTop() != 0) {
					$('#back-to-top').fadeIn();	
				} else {
					$('#back-to-top').fadeOut();
				}
			});
			$('#back-to-top').click(function() {
				$('body,html').animate({scrollTop:0},600);
			});	

	})();
	
function timeConverter(UNIX_timestamp, dateformat){
	var a = new Date(UNIX_timestamp * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	if(dateformat=="date"){
  		return  date;
  	} else if(dateformat=="month"){
  		return  month;
  	} else {
  		return  date+' '+month+' '+year;
  	}
}

$("#contactForm").validate({
	rules: {
		name: "required",
		email: {
			required: true, email: true
		},
		message: "required"
	},
	messages: {
		name: "Please enter your name",
		email: {
			required: "Please enter your E-mail",
			email: "Please enter valid E-mail"
		},
		message: "Please leave your message!"
	}
});
	
function fetch_follow_us()	{
	$('#follow_us_tokens').hide();
	var val= "['jobshout-facebook', 'jobshout-linkedin', 'jobshout-google-plus']";
	var jsonRow="/fetch_tokens_content?code="+val;
	$.getJSON(jsonRow,function(html){
		if(html.aaData){
			var contentHtml="";
			$.each(html.aaData, function(i,row){
				var iconUi='';
				switch (row.code) {
    				case 'jobshout-linkedin':
       				iconUi = '<i class="fa fa-linkedin"></i>';
        			break;
        			case 'jobshout-facebook':
       				iconUi = '<i class="fa fa-facebook"></i>';
        			break;
        			case 'jobshout-twitter':
       				iconUi = '<i class="fa fa-twitter"></i>';
        			break;
        			case 'jobshout-youtube':
       				iconUi = '<i class="fa fa-youtube"></i>';
        			break;    
        			case 'jobshout-google-plus':
       				iconUi = '<i class="fa fa-google-plus"></i>';
        			break;    	
				}
				contentHtml+='<li><a href="'+row.token_content+'" target="_blank">'+iconUi+'</i></a></li>';
			});
			if(contentHtml!=""){
				$('#follow_us_tokens').show();
				$("#follow_us_data").html(contentHtml);
			}
		}
	});
}
$(document).ready(function() {
	//fetch follow us content
// 	/fetch_follow_us();
	
	$.getJSON("/fetchTweets",function(html){
		var contentHtml="";
		if(html.error){
			$("#load_tweets").append('<div class="tweet-box">Sorry, no latest tweets found!</div>');
		}else{
			$.each(html.aaData, function(i,row){
				contentHtml+='<div class="tweet-box">';
        		contentHtml+='<i class="fa fa-twitter"></i>';
         		var textStr=row.text;
        		if(textStr.length>50){
        			textStr=textStr.substr(0,50)+"...";
                }
                contentHtml+='<em>'+textStr+'<br><a target="_blank" href="https://twitter.com/jobshoutnews?ref_src=twsrc%5Etfw">twitter.com/jobshoutnews</a></em>';
              	contentHtml+='</div>';
			});	
		}
		$("#load_tweets").append(contentHtml);
	});
	
	$.getJSON("/search-results?start=0&s=&type=blog&limit=3",function(html){
			if(html.error){
				$("#latestfooterblogs").before('<div class="alert">No blogs found!</div>');
			}else{
				
				var contentHtml="";
				$.each(html.aaData, function(i,row){
					if(row.Code!=""){
						contentHtml+='<li><i class="fa fa-angle-right"></i>';
						if(row.Published_timestamp){
							contentHtml+='<strong>'+timeConverter(row.Published_timestamp)+'</strong>:&nbsp;';
						}
						contentHtml+='<a href="/'+row.Code+'" title="'+row.Document+'">'+row.Document+'</a>';
						contentHtml+='</li>';
                    }
				});
				$("#latestfooterblogs").html(contentHtml);
			}
	});
});
$.checkSearchBox = function checkSearchBox(){
	var csearch = $('#csearch').val();	
	var csearch1 = $('#csearch1').val();	
	if(csearch=="" && csearch1==""){
		alert('Please enter job search keyword(s)');return false;
	}
	else return true;
}

function getUrlVars(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
function applyPagination(total_count,displayResultsNum){
	currentPageNum= parseInt(currentPageNum);
	if( isNaN(currentPageNum)){
		currentPageNum=1;
	}	
	var itemsPerPage=pageSize;
	var paginationHtml='<div class="text-center"><ul class="pagination">';
	var tpages = Math.ceil(total_count/itemsPerPage);
	if(tpages<=0){
		tpages=1;
	}
	var adjacents = 2;
	var currentLink= "/"+typeStr;
	
	if (currentPageNum == 1) {
		paginationHtml+= '<li><a href="javascript:void(0)" >«</a></li>';
   	} else if (currentPageNum == 2) {
   		paginationHtml+= '<li><a href="javascript:void(0)" href="'+currentLink+'">«</a></li>';
    } else {
        var prePage= currentPageNum-1;
        paginationHtml+= '<li><a href="'+currentLink+'?page='+prePage+'">«</a></li>';
    }
   											
   	var pmin=1;
   	if(currentPageNum>adjacents){
   		pmin=parseInt(currentPageNum) - parseInt(adjacents);
   	}
   											
    var pmax=tpages;
    if(currentPageNum < (tpages - adjacents)){
    	pmax = parseInt(currentPageNum) + parseInt(adjacents);
	}
    									
	for (var i=pmin; i <= pmax; i++) {
    	if (i == currentPageNum) {
        	paginationHtml+= '<li class="active"><a href="javascript:void(0)" >'+i+'</a></li>';
        } else if (i == 1) {
        	paginationHtml+= '<li><a href="'+currentLink+'" >'+i+'</a></li>';
        } else {
       		paginationHtml+= '<li><a href="'+currentLink+'?page='+i+'">'+i+'</a></li>';
    	}
   	}
   											
   	if (currentPageNum<(tpages - adjacents)) {
		paginationHtml+= '<li><a href="'+currentLink+'?page='+tpages+'" >'+tpages+'</a></li>';
    }
    
    // next
    if (currentPageNum < tpages) {
    	var nxtPage= parseInt(currentPageNum)+1;
    	paginationHtml+= '<li><a href="'+currentLink+'?page='+nxtPage+'">»</a></li>';
    } else {
    	paginationHtml+= '<li><a href="javascript:void(0)">»</a></li>';
    }
	paginationHtml+='</ul>';
	paginationHtml+='<div style="height:30px;"> </div>';
	return paginationHtml;
}

