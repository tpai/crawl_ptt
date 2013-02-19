var http = require('http'),
	util = require('util'),
	director = require('director'),
	send = require('send'),
	url  = require('url'),
	mu   = require('mu2'),
	jsdom = require('jsdom'),
	$ = require('jquery'),
	async = require('async'),
	cronJob = require('cron').CronJob,
	fc = require('./libs/funcs'),
	rd = require('./libs/renderer'),
	
	//database settigns
	dbserver = "localhost",
	dbport = 3001,
	dbname = "ptt_boards",
	mongodb = require('mongodb'),
	mongodbServer = new mongodb.Server(dbserver, dbport, { safe: false }),

	//server settings
	svrport = 977,

	//cronjob settings
	boards = [
		"Beauty",
		"movie",
		"StupidClown",
		"joke",
		"C_Chat"
	],
	cronTime = "00 00 03 * * *",
	beforeDays = 1,
	pushIWant = 30,

	//encode converter settings
	domain = "your-domain-name.here",
	path = "/middle-urls",
	converter_url = "http://" + domain + path + "/converter.php",
	file_get_contents = "http://" + domain + path + "/file_get_contents.php?url=";
	remote_data_source = "http://remote-domain-name.here/";
	
var router = new director.http.Router();

mu.root = __dirname + '/templates';

var fullDate;
var postArray;
var postsInBoard;

var initialVars = function() {
	var today = new Date().getTime();
	var yesterday = today - 86400 * 1000 * beforeDays;
	var month = new Date(yesterday).getMonth() + 1;
	var day = new Date(yesterday).getDate();
	var date = month + "/" + fc.patchZero(day, 2);
	fullDate = new Date(yesterday).getFullYear()+"/"+date;
	postArray = [];
};

var collection;
new mongodb.Db(dbname, mongodbServer, {w: 1}).open(function (error, client) {
	if (error) throw error;
	collection = new mongodb.Collection(client, 'posts');
	console.log("------------------------------------------")
	console.log("Crawlptt working at port "+svrport)
	//first fetching
	//initialVars();
	//routine();
});

http.createServer(function (req, res) {
	mu.clearCache();
	//route by director
	router.dispatch(req, res, function (err) {
		if (err) {
			res.writeHead(404);
			res.end();
		}
	});
}).listen(svrport);

router.get('/\/assets[^*]*/', function() {
	send(this.req, url.parse(this.req.url).pathname).root(__dirname+"/templates").pipe(this.res);
})

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
				tmpArr = fc.getUnique(tmpArr).sort(fc.desc);
				$.each(tmpArr, function(k, v) {
					dateArr.push({
						y: fc.divDate(v)["y"],
						m: fc.monthDigitToEn(fc.divDate(v)["m"]),
						d: fc.divDate(v)["d"],
						timestamp: fc.toTimestamp(v)
					});
					if(k == tmpArr.length - 1) {
						var stream = mu.compileAndRender('index.html', {data: dateArr});
						stream.pipe(res);
					}
				})
			}
		})
	})
});

router.get('/:timestamp', function(ts) {
	var res = this.res;
	collection.find({date: fc.toDate(ts)}).toArray(function(err, data) {
		async.series({
			original: function(callback) {
				$.each(data, function(key, val){
					$.each(val.posts, function(k, v) {
						var arr = v.link.split("/");
						v.link = "/read/"+ts+"/"+arr[arr.length-2]+"/"+arr[arr.length-1];
						if(v.push >= 100)v.push = "<font color='red'>爆</font>";
					})
					if(key == data.length - 1) {
						callback(null);
					}
				})
			},
			another: function(callback) {
				var board = "Gossiping";
				/* another data resource url */
				var url = remote_data_source+fc.toDate2(ts);
				$.ajax({
					type: "GET",
					url: file_get_contents+url,
					dataType: 'json',
					success: function(json){
						var posts = [];
						if(json.length != 0) {
							$.each(json, function(key, val) {
								posts.push({
									id: val.id,
									link: "/read/"+ts+"/"+board+"/"+val.id,
									title: val.title
								});
								if(key == json.length - 1) {
									data.push({
										board: board,
										posts: posts
									})
								}
							})
						}
						var stream = mu.compileAndRender('news.html', {date: fc.toDate(ts), timestamp: ts, data: data});
						stream.pipe(res);
						callback(null);
					},
					error: function() {
						//console.log("Gossiping board error!")
						var stream = mu.compileAndRender('news.html', {date: fc.toDate(ts), timestamp: ts, data: data});
						stream.pipe(res);
						callback(null);
					}
				});
			}
		}, function(err, results) {
			if(err)throw err;
		});
	});
});

router.get('/read/:timestamp/:board/:article', function(ts, board, article) {
	var res = this.res;
	var title, body;
	async.series({
		chooseBackend: function(callback) {
			//from djw
			if(board == "Gossiping") {
				/* another data resource url */
				var url = remote_data_source+fc.toDate2(ts);
				$.getJSON(file_get_contents+url, function(json){
					var posts = [];
					$.each(json, function(key, val) {
						if(article == val.id) {
							title = val.title;
							body = (val.head+"/n/n"+val.full_article).replace(/\/n/g, "\n");
							callback(null);
						}
					})
				})
			}
			//own db
			else {
				jsdom.env(converter_url+"?timestamp="+new Date().getTime()+"&board="+board+"&article="+article, function (errors, window) {

					var target = window.document.getElementById('mainContent');
					if(target == null || article.search(".deleted") != -1) {
						//console.log("Error occured: "+ts+"/"+board+"/"+article);
						var stream = mu.compileAndRender('error.html');
						stream.pipe(res);
						return ;
					} else {
						var timestamp = article.match(/M.[^.A]*/)[0].replace(/M./g, "");
						var date = fc.toDate(timestamp);
						body = target.children[1].getElementsByTagName('pre')[0].innerHTML;

						var tmp;
						if(tmp = body.match(/標題:[^\n]*/))title = tmp[0].replace(/標題: /g, "");
						//else title = body.match(/標題[^\n]*/)[0].replace(/標題 /g, "");
						else title = "null";

						callback(null);
					}
				});

			}
		},
		renderPage: function(callback) {

			//youtube player
			body = rd.renderYoutubePlayer(body);
			//xuite player
			body = rd.renderXuitePlayer(body);
			//image preview
			body = rd.renderImageTag(body);
			//ansi preview
			body = rd.renderANSIImage(body);
			//clean the comments
			body = rd.renderNoDateComments(body);
			//filter the broken ANSI
			body = rd.filterBrokenANSI(body);

			var stream = mu.compileAndRender('read.html', {
				date: fc.toDate(ts),
				timestamp: ts,
				board: board,
				title: title,
				article: article,
				body: body
			});
			stream.pipe(res);
			callback(null);
		},
	})
});

var fetchPosts = function(url, callback) {

	var stop = false;
	jsdom.env(converter_url+"?timestamp="+new Date().getTime()+"&url="+url, function (errors, window) {
		var arr = window.document.getElementById('prodlist').children[1].getElementsByTagName('dd');
		for(var i=arr.length-1;i>=0;i--) {
			var attrs = $(arr[i]).find("td"); // id|push|date|author|title
			var link = $(attrs[5]).find("a").prop("href").replace("localhost", "www.ptt.cc");
			//console.log(link);

			if(link.search(".deleted") == -1) {
				var postDate = fc.toDate(link.match(/M.[^.]*/)[0].replace(/M./g, ""));
				//console.log("post date:"+postDate+"|full date:"+fullDate);

				if(fc.toTimestamp(postDate) < fc.toTimestamp(fullDate)) {
					stop = true;
					postArray.push(postsInBoard);
					callback(null);
					return ;
				}
				else if(fc.toTimestamp(postDate) > fc.toTimestamp(fullDate)) {
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
		}
		if(totalPage == 0) {
			totalPage = window.document.getElementById('prodlist').children[0].innerHTML.
			match(/ [0-9]{3,4} /)[0].
			replace(/ /g, "");
		}
		totalPage -= 1;
		//rescursive
		if(stop == false) {
			fetchPosts(url.split("index")[0]+"index"+totalPage+".html", callback);
			//console.log(url.split("index")[0]+"index"+totalPage+".html");
		}
	});
};

var cronJob = require('cron').CronJob;
try {
	new cronJob({
		cronTime: cronTime,
		onTick: function() {
			routine();
		},
		start: true,
		timeZone: "Asia/Taipei"
	})
} catch(ex) {
	console.log("Cron pattern not valid");
}

var routine = function() {
	async.series({
		dbcheck: function (callback) {
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
		fetchposts: function(callback){
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
		intodb: function(callback){

			console.log("------------------------------------------")
			async.forEachSeries(postArray, function(val, callback) {
				console.log("Update "+val.posts.length+" posts into "+val.board);
				collection.insert(val, function(err, data) {
					if (data) {
						console.log('Successfully Insert');
					} else {
						console.log('Failed to Insert');
					}
					callback(null)
				});
			}, function(err) {
				callback(null)
			})
		},
	}, function(err, results) {
		console.log("------------------------------------------")
		console.log("CronJob Done!");
	});
};