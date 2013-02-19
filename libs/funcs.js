module.exports = {
	desc: function(x,y) {
		if (x > y) 
		return -1;
		if (x < y) 
		return 1;
	},
	patchZero: function(num, offset) {
		var min = Math.pow(10, offset-1)
		var tmp = num;
		while(tmp < min) {
			num = "0"+num;
			tmp *= 10;
		}
		return num;
	},
	toTimestamp: function(date) {
		return Date.parse(date) / 1000;
	},
	toDate: function(timestamp) {
		var ts = timestamp * 1000;
		return new Date(ts).getFullYear()+"/"+
		(new Date(ts).getMonth()+1)+"/"+
		this.patchZero(new Date(ts).getDate(), 2);
	},
	divDate: function(date) {
		return {y: date.split("/")[0], m: date.split("/")[1], d: date.split("/")[2]};
	},
	monthDigitToEn: function(m) {
		var en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return en[m-1];
	},
	toDate2: function(timestamp) {
		var ts = timestamp * 1000;
		return new Date(ts).getFullYear()+"/"+
		(new Date(ts).getMonth()+1)+"/"+
		new Date(ts).getDate();
	},
	getUnique: function(arr) {
		var que = [];
		for(var i = 0; i < arr.length; i++) {
				for(var j = i + 1; j < arr.length; j++) {
					if(arr[i] === arr[j]) j = ++i;
				}
				que.push(arr[i]);
		}
		return que;
	}
};

var daysInMonth = function(month, year) {
	return new Date(year, month, 0).getDate();
};