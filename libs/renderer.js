module.exports = {
	//youtube player
	renderYoutubePlayer: function(html) {
		return html.replace(/\<div><iframe class="youtube-player" type="text\/html" width="640" height="385"/g, '<div class="embed-container"><iframe type="text/html"');
	},

	//xuite player
	renderXuitePlayer: function(html) {
		var xuiteId = new Array();
		xuiteId = html.match(/vlog.xuite.net\/play\/[^"]*/);
		if(xuiteId) {
			for(var i=0;i<xuiteId.length;i++) {
				var id = xuiteId[i].replace("vlog.xuite.net/play/", "")
				var xuitePlayer = "<div class='embed-container'><iframe marginwidth='0' marginheight='0' src='http://vlog.xuite.net/embed/"+id+"?ar=0&as=0' scrolling='no' frameborder='0'></iframe></div>";
				html = html.replace(id+"</a>", id+"</a>\n"+xuitePlayer);
				if(i == xuiteId.length - 1)return html;
			}
		}
		else {
			return html;
		}
	},
	//image preview
	renderImageTag: function(html) {
		var imgLink = new Array();
		imgLink = html.match(/href="[^"]*/g);
		if(imgLink) {
			for(var i=0;i<imgLink.length;i++) {
				var url = imgLink[i].replace(/\href="/g, "");
				var appendImage;
				if(url.search("ppt.cc") != -1)
					appendImage = url+"</a>\n<img src='"+url+"@.jpg'>";
				else if(url.search("imageshack.us") != -1)
					appendImage = url+"</a>\n<img src='"+url.replace(/photo\/my-images/g, "scaled/landing").replace(/.jpg\//g, ".jpg")+"'>"
				else
					appendImage = url+"</a>\n<img src='"+url+"'>";

				html = html.replace(url+"</a>", appendImage);

				if(i == imgLink.length - 1)return html;
			}
		}
		else {
			return html;
		}
	},
	//ansi preview
	renderANSIImage: function(html) {
		var ansi_urls = html.match(/href=\"http:\/\/ansi.loli.tw\/ansiarts[^">]*/g);
		if(ansi_urls != null) {
			for(var i=0;i<ansi_urls.length;i++) {
				var url = ansi_urls[i].replace(/href=\"/g ,"");
				html = html.replace(url+"</a>", url+"</a>\n<img src='"+url+".png'>");
				if(i == ansi_urls.length - 1)return html;
			}
		}
		else {
			return html;
		}
	},
	//clean the comments
	renderNoDateComments: function(body) {
		var comments = body.match(/[推,噓,→][^☺]*/)[0].split("\n");
		for(var i=0;i<comments.length;i++) {
			body = body.replace(comments[i], comments[i].replace(/[ ]*\d{1,2}\/\d{1,2} \d{2,2}:\d{2,2}/g, ""));
			if(i == comments.length - 1) {
				return body;
			}
		}
	},
	//filter the broken ANSI
	filterBrokenANSI: function(body) {
		if(body.match(/作者[^☺]*/)!= null)
			return body.match(/作者[^☺]*/)[0];
		else
			return body;
	}
};