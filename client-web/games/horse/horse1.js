
var runTimer = null;
var TIME = 0;
var BACKSPEED = 0;
var ISRUN = false;
var PLAYGROUND_HEIGHT = 480;
var REFRESH_RATE = 50;
var TRACKLENG = 0;
var LengData = {};
var GAMETIME = 0;
var myResult = [];
var HorseData = {};
var horseList = [1,2,3,4,5,6];

var staticHorse1;
var staticHorse2;
var staticHorse3;
var dynamicHorse1;
var dynamicHorse2;
var dynamicHorse3;
var startBtn;
var background1;
var background2;
var background3;
var background4;
var hl1;
var hl2;
var bgSound;
var clickSound;
var readySound;
var runSound;
var winSound;
var loseSound;
var lastRunTime = 0;    //最后一次跑的时间

function Message(str, time) {
	try
	{
		str = i18n.t(str);
	}
	catch(e){}
	$('#msg').html(str)
	var msgWidth = $('#msg').outerWidth( true )
	var windowWidth = $('#playground').width()
	var left = windowWidth/2-msgWidth/2-2
	$('#msg').css({
		left:left
	})
	$('#msg').fadeIn(250, function(){
		if (time > 0)
		{
			setTimeout(function(){
				$('#msg').fadeOut(250);
			}, time*1000);
		}
	});
}

function lockBet()
{
    $('#oneHorse button').addClass('disabled');
    $('#twoHorse button').addClass('disabled');
    $('#threeHorse button').addClass('disabled');
}
function unLockBet()
{
    $('#oneHorse button').removeClass('disabled');
    $('#twoHorse button').removeClass('disabled');
    $('#threeHorse button').removeClass('disabled');
}
function InitSocket()
{
    var domain = document.domain;
    SOCKET = io.connect('//'+domain+':9002');
    SOCKET.on('connect', function(data){
        SOCKET.emit('init', $.cookie('coin'));
        showFloatMsg('success', connectSuccess);
    })
    SOCKET.on('error', function(){
        showFloatMsg('warning', connectError);
    })
    SOCKET.on('disconnect', function(data){
        showFloatMsg('warning', disconnected);
    })
    SOCKET.on('init', function(data){
		console.log('init')
		$('#msg').fadeOut(250);
        Reinitialize();
		TIME = 0;
		GAMETIME = data.gameTime;
        $('#serverSeedHash').text(data.serverSeedHash);
        $('#oneHorse .numberOfPeople').text(data.oneHorse.numberOfPeople);
		$('#oneHorse .numberOfBets').text(data.oneHorse.numberOfBets);
		$('#twoHorse .numberOfPeople').text(data.twoHorse.numberOfPeople);
		$('#twoHorse .numberOfBets').text(data.twoHorse.numberOfBets);
		$('#threeHorse .numberOfPeople').text(data.threeHorse.numberOfPeople);
		$('#threeHorse .numberOfBets').text(data.threeHorse.numberOfBets);
		if (data.isStart)
			Message(waitOver, 0);
        for (var coin in data.numberDict)
        {
            $('#coin-'+coin+' .number').text(data.numberDict[coin]);
        }
    })
    SOCKET.on('my', function(data){
        for (var horse in data.horseData)
        {
            $('#horse'+horse+' .myBet').text(data.horseData[horse].toFixedEx(8));
        }
        if (typeof data.myBalance != 'undefined')
            $('#myBalance').text(data.myBalance.toFixedEx(8));
    })
    SOCKET.on('restore', function(data){
        var myBalance = parseFloat($('#myBalance').text());
        myBalance = CheckNumber(myBalance + data);
        $('#myBalance').text(myBalance);
        ReInitData();
    })
    SOCKET.on('number', function(data){
        for (var coin in data)
        {
            $('#coin-'+coin+' .number').text(data[coin]);
        }
    })
	SOCKET.on('start', function(data){
        HorseData = data;
    })
    SOCKET.on('payout', function(data){
        myResult = data;
    })
    SOCKET.on('msg', function(data){
        Message(data, 3);
    })

}

function InitUI()
{
    var frameWidth = $('#horseFrame').width();
    $("#playground").playground({height: PLAYGROUND_HEIGHT, width: frameWidth});
    background1 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg1.png"});
    background2 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg2.png"});
    background3 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg5.png"});
    background4 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg6.png"});
    hl1 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg3.png"});
    hl2 = new $.gameQuery.Animation({imageURL: "/images/horse2/bg4.png"});
    staticHorse1 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse1.png"});
    staticHorse2 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse2.png"});
    staticHorse3 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse3.png"});
    staticHorse4 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse4.png"});
    staticHorse5 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse5.png"});
    staticHorse6 = new $.gameQuery.Animation({imageURL: "/images/horse2/horse6.png"});
    startBtn = new $.gameQuery.Animation({imageURL: "/images/horse2/start.png"});

    dynamicHorse1 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse1.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});
    dynamicHorse2 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse2.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});
    dynamicHorse3 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse3.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});
    dynamicHorse4 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse4.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});
    dynamicHorse5 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse5.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});
    dynamicHorse6 = new $.gameQuery.Animation({
        imageURL: "/images/horse2/horse6.png",
        numberOfFrame: 4,
        delta: 109,
        rate: 120,
        type: $.gameQuery.ANIMATION_HORIZONTAL});

    $.playground()
        .addGroup("background", {width: frameWidth,
            height: PLAYGROUND_HEIGHT})
        .addSprite("hl1", {animation: hl1,
            width: 4976,
            height: 126})
        .addSprite("background1", {animation: background1,
            width: 136,
            height: 270, posx:0, posy: 126})
        .addSprite("background2", {animation: background2,
            width: 4976,
            height: 270, posx:0, posy: 126})
        .addSprite("background3", {animation: background3,
            width: 40,
            height: 270, posx:0, posy: 126})
        .addSprite("background4", {animation: background4,
            width: 170,
            height: 270, posx:0, posy: 126})
        .addSprite("hl2", {animation: hl2,
            width: 4976,
            height: 126, posx:0, posy: 396})
        .addSprite("startBtn", {animation: startBtn,
            width: 159,
            height: 55, posx:(frameWidth-159)/2, posy: 220}).end()
        .addSprite("horse1", {animation: staticHorse1, posx:0, posy: 104, width: 109, height: 61})
        .addSprite("horse2", {animation: staticHorse2, posx:0, posy: 150, width: 109, height: 61})
        .addSprite("horse3", {animation: staticHorse3, posx:0, posy: 196, width: 109, height: 61})
        .addSprite("horse4", {animation: staticHorse4, posx:0, posy: 242, width: 109, height: 61})
        .addSprite("horse5", {animation: staticHorse5, posx:0, posy: 288, width: 109, height: 61})
        .addSprite("horse6", {animation: staticHorse6, posx:0, posy: 334, width: 109, height: 61})
    $.playground().startGame(function(){
        $('#hl1').css('background-repeat', 'repeat-x');
        $('#hl2').css('background-repeat', 'repeat-x');
        $('#background2').css('background-repeat', 'repeat-x');
        $('#background2').css('left', 136);
        $('#background3').css('left', 2000);
        $('#background4').css('left', 2000+40);
    })

    $('#startBtn').mouseover(function(){
        $(this).css({'background-image':'url(/images/horse2/start2.png)'});
    }).mouseout(function(){
            $(this).css({'background-image':'url(/images/horse2/start.png)'});
        }).click(function(){
            $(this).fadeOut(250);
            clickSound.play();
            $(".bet").addClass('disabled');
            SOCKET.emit('start', null);
            readdyGO(function(){
                var loopTimer = setInterval(function(){
                    if (getObjectlength(HorseData) > 0)
                    {
                        StartGame(HorseData);
                        clearInterval(loopTimer);
                    }
                }, 100)
            });
        })

    //声音
    bgSound = soundManager.createSound({
        url: '/sound/horse/bg.ogg'
    });
    loopSound(bgSound);
    clickSound = soundManager.createSound({
        url: '/sound/click.wav'
    });
    runSound = soundManager.createSound({
        url: '/sound/horse/horse.ogg'
    });
    readySound = soundManager.createSound({
        url: '/sound/horse/ready.wav'
    });
    winSound = soundManager.createSound({
        url: '/sound/horse/win.mp3'
    });
    loseSound = soundManager.createSound({
        url: '/sound/horse/lose.mp3'
    });
}

function ReinitPos()
{
    $("#hl1").css("left", 0);
    $("#hl2").css("left", 0);
    $("#background1").css("left", 0);
    $("#background2").css("left", 136);
    $('#background3').css('left', 2000);
    $('#background4').css('left', 2000+40);
    for (var h = 0; h < horseList.length; h++)
    {
        var horse = horseList[h];
        $("#horse"+horse).css('left', 0);
     }
    TRACKLENG = 0;
}
function ReInitData(){
    for (var h = 0; h < horseList.length; h++)
    {
        var horse = horseList[h];
        $('#horse'+horse+' .myBet').text(0);
    }
    $('.number').text(0);
}
function Reinitialize()
{
    $('#startBtn').fadeIn(250);
    $(".bet").removeClass('disabled');
    ReinitPos();
    console.log('Reinitialize')
    ReInitData();
}

function confirmBet(amount, bakfun){
    var coin = $.cookie('coin');
    if(window.confirm(i18n.t('Are you sure you bet')+' '+amount+' '+coin+'?')){
        bakfun();
    }
}

function readdyGO(callback){
    var n = 3;
    Message(n, 0);
    readySound.play();
    n--;
    var readdyTimer = setInterval(function(){
        if (n == 0)
            Message('GO!', 1);
        else if (n == -1)
        {
            clearInterval(readdyTimer);
            return callback();
        }
        else
            Message(n, 0);
        readySound.play();
        n--;
    }, 1000);
}

$(document).ready(function() {
	InitSocket();
	//InitUI();
	$('.bet').click(function(){
        var horse = $(this).attr('data');
		var value = parseFloat($('#horse'+horse+' input').val());
		if (isNaN(value)) value = 0;
		if (value == 0) return;
        confirmBet(value, function(){
            SOCKET.emit('bet', {horse:horse, bet:value});
            clickSound.play();
        })
	})

})
function payout()
{
    var str = "";
    var myBalance = parseFloat($('#myBalance').text());
    var coin = $.cookie('coin');
    var result = myResult;
    var balance = result.balance;
    var time = 0;
    balance = parseFloat(balance.toFixed(8))*1.0;
    if (result.wager > 0){
        if (balance > 0)
        {
            str += i18n.t('Win bonus:')+' '+balance+coinToShortName(coin);
            myBalance = myBalance + balance;
            winSound.play();
        }
        else
        {
            str += i18n.t('Failure');
            loseSound.play();
        }
        Message(str, 3);
        time = 4000;
    }
    setTimeout(function(){
        Reinitialize();
    }, time);
    $('#myBalance').text(myBalance.toFixedEx(8));
}
function addResult()
{
    var result = myResult;
    var str = '<tr><td>'+result.id+'</td><td>'+toTimeStr(result.date)+'</td><td>'+result.winHorse+'</td><td>'+result.horseList.toString()+'</td><td>'+result.wager.toFixedEx(8)+'</td><td>'+result.profit.toFixedEx(8)+'</td><td><div class="modal" id="verifyModal'+result.id+'"></div><a href="/racing/verify/'+result.id+'" class="btn btn-primary btn-xs" data-toggle="modal" data-target="#verifyModal'+result.id+'">验证</a></td></tr>';
    $('#myBet table tr:first-child').after(str);
    myResult = {};
}
function Run(n, rollTime, data)
{
    var frameWidth = $('#horseFrame').width();
	var r = 0;
    var horse = 0;
    var minLeng = Math.min.apply(null, objecValues(LengData));
    if (minLeng != Infinity && minLeng >= frameWidth)
    {
        clearInterval(runTimer);
        $("#horse1").setAnimation(staticHorse1);
        $("#horse2").setAnimation(staticHorse2);
        $("#horse3").setAnimation(staticHorse3);
        $("#horse4").setAnimation(staticHorse4);
        $("#horse5").setAnimation(staticHorse5);
        $("#horse6").setAnimation(staticHorse6);
        var winHorse = 0;
        var maxLeng = Math.max.apply(null, objecValues(LengData));
        for (var h = 0; h < horseList.length; h++)
        {
            horse = horseList[h];
            if (maxLeng == LengData[horse])
            {
                winHorse = horse;
                break;
            }
        }
        Message(winHorse+horseGetWin, 3);
        LengData = {};
        HorseData = {};
        var time = 4000;
        setTimeout(function(){
            payout();
            addResult();
        }, time);
        time += 4000;
    }
    else
    {
        if (n < rollTime)
        {
            $("#hl1").css('left', $("#hl1").position().left - BACKSPEED);
            $("#hl2").css('left', $("#hl2").position().left - BACKSPEED);
            $("#background1").css('left', $("#background1").position().left - BACKSPEED);
            $("#background2").css('left', $("#background2").position().left - BACKSPEED);
            $("#background3").css('left', $("#background3").position().left - BACKSPEED);
            $("#background4").css('left', $("#background4").position().left - BACKSPEED);
        }
        for (var h = 0; h < horseList.length; h++)
        {
            horse = horseList[h];
            r = data[horse][n];
            if (typeof r == 'undefined'){
                r = 7;
            }
            $("#horse"+horse).css('left', $("#horse"+horse).position().left + r);
            if (!LengData[horse]) LengData[horse] = 0;
            LengData[horse] += r;
        }
        if (lastRunTime == 0  || getNowTime() - lastRunTime >= 150){
            runSound.play();
            lastRunTime = getNowTime();
        }

    }
    //n++;
    //setTimeout(function(){
    //    Run(n, rollTime);
    //}, REFRESH_RATE);
}

function StartGame(data)
{
    lockBet();
    $('#msg').fadeOut(250);
    ReinitPos();

    var frameWidth = $('#horseFrame').width();
    $('#msg').hide();
	$("#horse1").setAnimation(dynamicHorse1);
	$("#horse2").setAnimation(dynamicHorse2);
	$("#horse3").setAnimation(dynamicHorse3);
    $("#horse4").setAnimation(dynamicHorse4);
    $("#horse5").setAnimation(dynamicHorse5);
    $("#horse6").setAnimation(dynamicHorse6);
    var rollTime = data[1].length;
    BACKSPEED = (2000-(frameWidth-210))/rollTime;
    var n = 0;
	//Run(n, rollTime);
    runTimer = setInterval(function(){
        Run(n, rollTime, data);
        n++;
    }, REFRESH_RATE);
    ISRUN = true;
}