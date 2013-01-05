crawl_ptt
=========

filter posts by amount of push from web ptt

從網頁版PTT上各版塊擷取特定推文數以上的文章

* * *

####First setup:

* setup apache server (support php)
* place all data into www folder
* run 'npm install' to download modules
* uncomment first fetching like below:

        //first fetching
        initialVars();
        routine();

* then node app.js

####首次安裝:

* 先裝好網頁伺服器 (須支援PHP)
* 將所有檔案放入 www/
* 執行 'npm install' 下載套件
* 將註解拿掉 如下所示

        //first fetching
        initialVars();
        routine();

* 執行app.js
