crawl_ptt
==========
filter posts by amount of push from web ptt

從網頁版PTT上各版塊擷取特定推文數以上的文章

##Installation

* find a apache server (support php), and place 'converter.php' into it. (big5 to utf8 problem)
* download modules by 'npm install'
* uncomment first fetching like below:

        //first fetching
        initialVars();
        routine();

* then node app.js

##安裝流程

* 先找個網頁伺服器 (須支援PHP), 然後將 converter.php 放入. (big5 to utf8編碼轉換問題)
* 執行 'npm install' 下載套件
* 將註解拿掉 如下所示

        //first fetching
        initialVars();
        routine();

* 執行app.js
