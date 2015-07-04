//跟扑克牌js有冲突
if(typeof exports != 'undefined'){
    Array.prototype.remove = function(val)
    {
        var index = this.indexOf(val);
        this.splice(index,1);
    };
}


Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
        "S" : this.getMilliseconds() //millisecond
    };
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4- RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1? o[k] :
                ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
};
Number.prototype.toFixedEx = function(n) {
    var str = this + '';
    return str.toFixedEx(n);
};
String.prototype.toFixedEx = function(n) {
    var this2 = parseFloat(this);
    var x = (this2).toFixed(15);
    var str = x.split('.');
    if (str.length == 2)
        return str[0] + '.' + str[1].substr(0, n);
    else
        return str[0];
};
Number.prototype.toFloat = function(n)
{
    if (!n) n = 8;
    var num = this.toFixed(n);
    return parseFloat(num*1.0);
};
Number.prototype.toInt = function()
{
    var n = parseInt(this);
    if (isNaN(n)) n = 0;
    return n;
};
//转成小数点
String.prototype.formatNumber = function(){
    var num = this;
    var num2;
    num=num.replace(/^([0-9]+)([0-9]{3})$/,"$1,$2");
    while(true){
        num2=num.replace(/([0-9])([0-9]{3}[,.])/,"$1,$2");
        if(num==num2)break;
        num=num2
    }
    return num;
};
String.prototype.ToInt = function()
{
    return parseInt(this);
};

rnd.today=new Date();
rnd.seed=rnd.today.getTime();

function rnd() {
    rnd.seed = (rnd.seed*9301+49297) % 233280;
    return rnd.seed/(233280.0);
}

(function (module) {
    module.exports = share = {
        getNowTime : function()
        {
            var now = new Date();
            var nowTime = now.getTime();
            return nowTime;
        },
        random : function (t1,t2,t3){//t1为下限，t2为上限，t3为需要保留的小数位
            function isNum(n){
                return /^\d+$/.test(n);
            }
            //if(!t1 || (! isNum(t1)) ){t1=0;}
            //if(!t2 || (! isNum(t2)) ){t2=1;}
            //if(!t3 || (! isNum(t3)) ){t3=0;}
            t3 = t3>15?15:t3; // 小数位不能大于15位
            var ra = Math.random() * (t2-t1)+t1,du=Math.pow(10,t3);
            ra = Math.round(ra * du)/du;

            return ra;
        },
        randomString : function (length, charSet) {
            var result = [];
            length = length || 16;
            charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            while (length--) {
                result.push(charSet[Math.floor(Math.random() * charSet.length)]);
            }
            return result.join('');
        },
        toNumber : function(str, len)
        {
            len = len || 8;
            var n = parseFloat(str);
            if (isNaN(n) || Math.abs(n) == Infinity)
                return 0;
            n = parseFloat(n.toFixed(len));
            if (n == 0)
                return Math.abs(n);
            return n*1.0;
        },
        getObjectlength : function(object) {
            object = object || {};
            return Object.keys(object).length;
        },
        indexOf : function(array, val){
            for (var i = 0; i < array.length; i++) {
                if (array[i] == val) return i;
            }
            return -1;
        },
        remove : function(list, val)
        {
            var index = list.indexOf(val);
            list.splice(index,1);
            return list;
        },
        coinToShortName : function(str)
        {
            return Coins[str]?Coins[str].shortName:'';
        },
        coinToFullName : function(str)
        {
            for (var item in Coins)
            {
                if (Coins[item].shortName == str)
                    return item;
            }
        },
        dictToList : function(tempDict){
            var tempList = [];
            for (var item in tempDict)
                tempList.push({name:item, value:tempDict[item]});
            return tempList;
        },
        dictToHtml : function(tempDict){
            var html = '';
            for (var item in tempDict)
                html += item+' '+tempDict[item].toFixedEx(8)+'<br>';
            return html;
        },
        parse : function (_text) {
            var re = /&lt;img src="(.+)"&gt;/ig;
            var re_ret = re.exec(_text);
            try{
                _text = _text.replace('&lt;img src="'+re_ret[1]+'"&gt;', '<img src="'+re_ret[1]+'">');
            }catch (e){}
            return _text;
        },
        getMaxBet : function(scale, bank){
            if (scale < 1000)
                return bank*0.0025;
            else if (bank >=   10000000)
                return bank*0.0025;
            else if (bank < 1000000 && bank >=   100000)
                return bank*0.005;
            else if (bank < 100000 && bank >=   0)
                return bank*0.01;
            else
                return bank*0.001;
        },
        //时间
        calcTime : function (time, offset) {
            var d = new Date(time);
            var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            var nd = new Date(utc + (3600000*offset));
            return nd;
        },
        getNowTimeStr : function(time, timeZoneOffset, format)
        {
            return this.toTimeStr(this.getNowTime());
        },
        toTimeStr : function(time, timeZoneOffset, format)
        {
            if (!time) return '';
            var d = new Date();
            var localTime = d.getTime();
            var localOffset = 0;
            if (timeZoneOffset)
                localOffset = parseInt(timeZoneOffset);
            else
                localOffset = Math.abs(d.getTimezoneOffset()/60);
            if (!format)
                format = "yyyy-MM-dd hh:mm:ss";
            return this.calcTime(time, localOffset).format(format);
        },
        strToTime : function(s){
            try
            {
                var d = new Date(Date.parse(s.replace(/-\//g,   "/")));
            }
            catch (e){
                d = new Date();
            }
            return d;
        },
        getToday : function(){
            var timeStr = new Date().format("yyyy-MM-dd");
            var todayTime = this.strToTime(timeStr+' 00:00:00').getTime();
            return todayTime;
        },
        getDays : function(startTime, endTime){
            var leftTime = endTime - startTime;
            return Math.floor(leftTime/(24*60*60*1000));
        },
        //相差多少天
        getDaysLeft : function(startTime, endTime){
            var todayTime = this.getToday();
            var days = this.getDays(startTime, endTime);
            var days2 = 0;
            //if (todayTime < endTime)
            days2 = this.getDays(todayTime, endTime);
            return days2;
        },
        //获取投注大小
        getWager : function (tempList)
        {
            if (!tempList) return 0;
            var n = 0;
            for (var i = 0; i < tempList.length; i++)
            {
                n += tempList[i];
            }
            return n;
        },
        hideLastString : function(str)
        {
            str = str.substring(0, str.length-1)+'*';
            return str;
        },
        toText : function(str){
            //function toHtml (html) {
            //    return html.replace('&lt;', /</g).replace('&gt;', />/g);
            //}
            //console.log(str);
            //str = toHtml(str);
            //console.log(str);
            return str.replace(/<.*?>/g, '').replace(/&nbsp;/g, ' ');
        },
        /**
         * js截取字符串，中英文都能用
         * @param str：需要截取的字符串
         * @param len: 需要截取的长度
         */
        cutStr : function (str, len)
        {
            var str_length = 0;
            var str_len = 0;
            var str_cut = new String();
            str_len = str.length;
            for(var i = 0;i<str_len;i++)
            {
                a = str.charAt(i);
                str_length++;
                if(escape(a).length > 4)
                {
                    //中文字符的长度经编码之后大于4
                    str_length++;
                }
                str_cut = str_cut.concat(a);
                if(str_length>=len)
                {
                    str_cut = str_cut.concat("...");
                    return str_cut;
                }
            }
            //如果给定字符串小于指定长度，则返回源字符串；
            if(str_length<len){
                return  str;
            }
        }
    }
})('undefined' === typeof module ? {
    module: {
        exports: {}
    }
} : module);