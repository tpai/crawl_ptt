<?php
	if(isset($_GET['board']) && $_GET['board'] != "") {
		$url = "http://www.ptt.cc/bbs/".$_GET['board']."/".$_GET['article'];
	}
	else if(isset($_GET['url']) && $_GET['url'] != "") {
		$url = $_GET['url'];
	}
	else {
		$url = "http://www.ptt.cc/bbs/joke/index.html";
	}
	$result = file_get_contents($url);
	echo mb_convert_encoding($result, "UTF-8", "big5");
?>