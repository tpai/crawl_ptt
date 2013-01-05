var http = require('http'),
  	util = require('util'),
  	mu   = require('mu2'),
  	jsdom = require('jsdom'),
    $ = require('jquery'),
	async = require('async'),
    director = require('director'),
    cronJob = require('cron').CronJob,
	
	dbname = "ptt_boards", //custom
	dbport = 3001; //custom
    mongodb = require('mongodb'),
    mongodbServer = new mongodb.Server('localhost', dbport, { safe: false }),
	boards = ["Beauty", "movie", "StupidClown", "joke", "C_Chat"], //custom
	beforeDays = 1, //custom
	pushIWant = 30, //custom
	cronTime = "00 10 00 * * *"; //custom
	
mu.root = __dirname + '/templates'

var fullDate;
var postArray;
var postsInBoard;

var initialVars = function() {
	var today = new Date().getTime();
	var yesterday = today - 86400 * 1000 * beforeDays;
	var month = new Date(yesterday).getMonth() + 1;
	var day = new Date(yesterday).getDate();
	var date = month + "/" + patchZero(day, 2);
	fullDate = new Date(yesterday).getFullYear()+"/"+date;
	postArray = [];
};

var collection;
new mongodb.Db(dbname, mongodbServer, {}).open(function (error, client) {
	if (error) throw error;
	collection = new mongodb.Collection(client, 'posts');
	//first fetching
	//initialVars();
	//routine();
});

http.createServer(function (req, res) {

	mu.clearCache();
	
	router.dispatch(req, res, function (err) {
      if (err) {
        res.writeHead(404);
        res.end();
      }
    });

}).listen(8000);

var router = new director.http.Router();

router.get('/', function() {
	var res = this.res;

	var tmpArr = [];
	var dateArr = [];
	collection.find({}).toArray(function(err, data) {
		$.each(data, function(key, val) {

			if(val.date != undefined) {
				tmpArr.push(val.date);
			}

			if(key == data.length - 1) {

				tmpArr = $.unique(tmpArr).sort(desc);

				$.each(tmpArr, function(k, v) {

					dateArr.push({date: v, timestamp: toTimestamp(v)});
					
					if(k == tmpArr.length - 1) {
						var stream = mu.compileAndRender('index.html', {data: dateArr});
						util.pump(stream, res);
					}
				})
			}
		})
	})
});

router.get('/:timestamp', function(ts) {
	var res = this.res;
	collection.find({date: toDate(ts)}).toArray(function(err, data) {
		$.each(data, function(key, val){ 
			$.each(val.posts, function(k, v) {
				var arr = v.link.split("/");
				v.link = "/read/"+arr[arr.length-2]+"/"+arr[arr.length-1];
				if(v.push >= 100)v.push = "<font color='red'>爆</font>";
			})
			if(key == data.length - 1) {
				var stream = mu.compileAndRender('news.html', {date: toDate(ts), timestamp: ts, data: data});
				util.pump(stream, res);
			}
		})
	});
});

router.get('/read/:board/:article', function(board, article) {
	var res = this.res;
	jsdom.env("http://localhost/crawl/converter.php?timestamp="+new Date().getTime()+"&board="+board+"&article="+article, function (errors, window) {

		var timestamp = article.match(/M.[^.A]*/)[0].replace(/M./g, "");
        var date = toDate(timestamp);

		var target = window.document.getElementById('mainContent');
		if(target == null) {
			console.log("Error Occured: "+board+"/"+article);
			var stream = mu.compileAndRender('error.html', {date: date, timestamp: timestamp});
			util.pump(stream, res);
			return ;
		} else {
			var body = target.children[1].getElementsByTagName('pre')[0].innerHTML;
			
			//youtube player
	        body = body.replace(/\<div><iframe class="youtube-player" type="text\/html" width="640" height="385"/g, '<div class="embed-container"><iframe type="text/html"');

	        //xuite player
	        var xuiteId = new Array();
	        xuiteId = body.match(/vlog.xuite.net\/play\/[^"]*/);
	        if(xuiteId) {
	          for(var i=0;i<xuiteId.length;i++) {
	            var id = xuiteId[i].replace("vlog.xuite.net/play/", "")
	            var xuitePlayer = "<div class='embed-container'><iframe marginwidth='0' marginheight='0' src='http://vlog.xuite.net/embed/"+id+"?ar=0&as=0' scrolling='no' frameborder='0'></iframe></div>";
	            body = body.replace(id+"</a>", id+"</a>\n"+xuitePlayer);
	          }
	        }

	        //image preview
	        $.fn.exists = function(){return this.length>0;}
	        var imgLink = new Array();
	        imgLink = body.match(/href="[^"]*/g);
	        if(imgLink) {
	          for(var i=0;i<imgLink.length;i++) {
	            var url = imgLink[i].replace(/\href="/g, "");
	            if($("<img src='"+url+"'>").exists()) {
	              var appendImage;
	              if(url.search("ppt.cc") != -1) {
	                appendImage = url+"</a>\n<img src='"+url+"@.jpg'>";
	              }
	              else
	                appendImage = url+"</a>\n<img src='"+url+"'>";

	              body = body.replace(url+"</a>", appendImage);
	            }
	          }
	        }

	        var tmp, title;
	        if(tmp = body.match(/標題:[^\n]*/))title = tmp[0].replace(/標題: /g, "");
	        else title = body.match(/標題[^\n]*/)[0].replace(/標題 /g, "");

			var stream = mu.compileAndRender('read.html', {
				date: date,
				timestamp: timestamp,
				board: board,
				title: title,
				article: article,
				body: body
			});
			util.pump(stream, res);
		}
	});
});

var fetchPosts = function(url, callback) {
  	
  	var stop = false;  	

  	jsdom.env("http://localhost/crawl/converter.php?timestamp="+new Date().getTime()+"&url="+url, function (errors, window) {

      var arr = window.document.getElementById('prodlist').children[1].getElementsByTagName('dd');

      for(var i=arr.length-1;i>=0;i--) {

        var attrs = $(arr[i]).find("td"); // id|push|date|author|title
        var link = $(attrs[5]).find("a").prop("href").replace("localhost", "www.ptt.cc");
        //console.log(link);

        if(link.search(".deleted") == -1) {
          var postDate = toDate(link.match(/M.[^.]*/)[0].replace(/M./g, ""));
          //console.log("post date:"+postDate+"|full date:"+fullDate);
        }
        
        if(toTimestamp(postDate) < toTimestamp(fullDate)) {
          stop = true;
          postArray.push(postsInBoard);
          callback(null);
          return ;
        }
        else if(toTimestamp(postDate) > toTimestamp(fullDate)) {
          stop = false;
        }
        else {
          var id = $(attrs[0]).html();
          var push = ($(attrs[2]).html()==' ')?'0':$(attrs[2]).html();
          var title = $(attrs[5]).find("a").html();
          if(push >= pushIWant && title.search("刪除") == -1) {
            //console.log("push entry "+id);
            postsInBoard["posts"].push({
				"id": id,
				"push": push,
				"link": link,
				"title": title
			});
          }
        }
      }
      if(totalPage == 0) {
        totalPage = window.document.getElementById('prodlist').children[0].innerHTML.match(/ [0-9]{3,4} /)[0].replace(/ /g, "");
      }
      totalPage -= 1;

      if(stop == false) {
        fetchPosts(url.split("index")[0]+"index"+totalPage+".html", callback);
        //console.log(url.split("index")[0]+"index"+totalPage+".html");
      }
    }
  );
};

var desc = function(x,y) {
	if (x > y) 
	return -1;
	if (x < y) 
	return 1;
};

var patchZero = function(num, offset) {
  var min = Math.pow(10, offset-1)
  var tmp = num;
  while(tmp < min) {
    num = "0"+num;
    tmp *= 10;
  }
  return num;
};

var toTimestamp = function(date) {
  return Date.parse(date) / 1000;
};

var toDate = function(timestamp) {
  var ts = timestamp * 1000;
  return new Date(ts).getFullYear()+"/"+
  (new Date(ts).getMonth()+1)+"/"+
  patchZero(new Date(ts).getDate(), 2);
};

var daysInMonth = function(month, year) {
  return new Date(year, month, 0).getDate();
};


var cronJob = require('cron').CronJob;
try {
  new cronJob({
    cronTime: cronTime,
	    onTick: routine,
    start: true,
    timeZone: "Asia/Taipei"
  })
} catch(ex) {
    console.log("Cron pattern not valid");
}

var routine = function() {
	async.series({
		zero: function dbCheck(callback) {
			console.log("------------------------------------------")
			console.log("Start to check database...")
			collection.find({}).toArray(function(error, data) {
				//console.log(data);
				if(data.length == 0) {
					console.log("Insert Collection")
					collection.insert({});
				}
				console.log("Database check complete!")
				console.log("------------------------------------------")
				callback(null);
			});
		},
		one: function(callback){
			initialVars();

			async.forEachSeries(boards, function(board, callback){

				totalPage = 0;
				postsInBoard = {
					"date": fullDate,
					"board": board,
					"posts": []
				};
				console.log("Start fetching "+fullDate+" posts from "+board+"...");
				fetchPosts("http://www.ptt.cc/bbs/"+board+"/index.html", callback);

			}, function(err) {
				callback(null);
			});
		},
		two: function(callback){

			console.log("------------------------------------------")
			$.each(postArray, function(key, val) {
				console.log("Update "+val.posts.length+" posts into "+val.board);
				collection.insert(val);
				if(key == postArray.length - 1)callback(null);
			})
		},
	}, function(err, results) {
		console.log("------------------------------------------")
		console.log("CronJob Done!");
	});
};