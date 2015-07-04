// if (!CanvasRenderingContext2D.roundRect)
    CanvasRenderingContext2D.prototype.myRoundRect =
        function(x, y, width, height, radius, fill, stroke) {
            if (typeof stroke == "undefined") {
                stroke = true;
            }
            if (typeof radius === "undefined") {
                radius = 5;
            }
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y+ height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
            if (stroke) {
                this.stroke();
            }
            if (fill) {
                this.fill();
            }
        };
define([
    'phaser',
    'poker',
    'soundmanager2',
    '/public/lib/rating/rating.min.js',
    '/public/lib/nanoscroller/jquery.nanoscroller.min.js',
    '/games/holdem/js/share.js'
], function(){
    var ShoeMap = [0, -100];
    var TableMap = {
        card : [-170, -55],
        cardType : [0, -10],
        wager : [0, -100],
        wagerText : [30, -120]
    };
    var PlayerMap = {
        player0 : {
            seat :[143, -160],
            dealer : [110, -138],
            card : [140, -210],
            wager : [120, -130],
            wagerText : [145, -130],
            color : '#C7956E'
        },
        player1 : {
            seat : [300, -77],
            dealer : [234, -78],
            card : [297, -127],
            wager : [200, -100],
            wagerText : [225, -96],
            color : '#D88AEC'
        },
        player2 : {
            seat : [300, 77],
            dealer : [234, -22],
            card : [297, 27],
            wager : [200, -15],
            wagerText : [225, -5],
            color : '#C7BB81'
        },
        player3 : {
            seat : [143, 160],
            dealer : [110, 33],
            card : [140, 110],
            wager : [120, 10],
            wagerText : [145, 10],
            color : '#81AAA7'
        },
        player4 : {
            seat : [0, 160],
            dealer : [0, 33],
            card : [-3, 110],
            wager : [-30, 10],
            wagerText : [-5, 10],
            color : '#5CB8CA'
        },
        player5 : {
            seat : [-143, 160],
            dealer : [-110, 33],
            card : [-146, 110],
            wager : [-140, 10],
            wagerText : [-115, 10],
            color : '#BDE695'
        },
        player6 : {
            seat : [-300, 77],
            dealer : [-234, -15],
            card : [-303, 27],
            wager : [-220, -20],
            wagerText : [-195, -20],
            color : '#E6E395'
        },
        player7 : {
            seat : [-300, -77],
            dealer : [-234, -85],
            card : [-303, -127],
            wager : [-220, -100],
            wagerText : [-195, -100],
            color : '#81AA7F'
        },
        player8 : {
            seat : [-143, -160],
            dealer : [-110, -138],
            card : [-146, -210],
            wager : [-140, -130],
            wagerText : [-115, -120],
            color : '#E66E43'
        }
    };
    var ChipMap = [[-201, 164, 1], [-176, 186, 10], [-145, 166, 100], [-117, 188, 1000], [-81, 175, 10000]];

    var initCards = function (game) {
        var cards = [];
        var suits = [];
        suits[0] = 'spades';
        suits[1] = 'diamonds';
        suits[2] = 'hearts';
        suits[3] = 'clubs';
        var values = [];
        values[0] = 'a';
        values[1] = '2';
        values[2] = '3';
        values[3] = '4';
        values[4] = '5';
        values[5] = '6';
        values[6] = '7';
        values[7] = '8';
        values[8] = '9';
        values[9] = '10';
        values[10] = 'j';
        values[11] = 'q';
        values[12] = 'k';
        var dataURI, img;
        for (var j = 0; j < suits.length; j++) {
            for (var k = 0; k < values.length; k++) {
                cards.push([suits[j], values[k]]);
                dataURI = Poker.getCardData(80, suits[j], values[k]);
                img = new Image();
                img.src = dataURI;
                game.cache.addImage(suits[j] + ',' + values[k], dataURI, img);
            }
        }
        //牌背面
        dataURI = Poker.getBackData(80, '#b55', '#a22');
        img = new Image();
        img.src = dataURI;
        game.cache.addImage('CardBack', dataURI, img);
    };
    var getChipIndex = function (amount) {
        for (var i = 0; i < ChipMap.length; i++) {
            if (ChipMap[i][2] == amount)
                return i;
        }
    };

    var Player = function (parent, seat, username, chips, status) {
        seat = 'player'+seat;
        this.game = parent.game;
        this.name = username;
        this.seat = seat;
        this.parent = parent;
        this.hands = [];
        this.wagers = [];

        this.box = this.game.add.sprite(this.game.world.centerX+PlayerMap[seat].seat[0], this.game.world.centerY-offset+PlayerMap[seat].seat[1]-10, 'box');
        this.box.anchor.set(0.5);
        var face = this.game.add.sprite(0, 0, 'face');
        face.anchor.set(0.5);

        var style = {font: "10px Arial", fill: "#fff", align: "center"};
        var text = this.game.add.text(0, -35, username, style);
        text.anchor.set(0.5);
        this.box.addChild(text);
        this.box.addChild(face);
        this.setChips(chips);
        this.setStatus(status);
    };
    Player.prototype.init = function(){
        this.hands.forEach(function(hand){
            hand.destroy();
        });
        this.wagers.forEach(function(wager){
            wager.destroy();
        });
        this.hands = [];
        this.wagers = [];
        if (this.statusText) {
            this.statusText.destroy();
            this.statusText = undefined;
        }
    };
    Player.prototype.destroy = function(){
        var self = this, time = 0;
        if (this.wagers.length > 0)
        {
            this.moveToPot();
            time = 800;
        }
        setTimeout(function(){
            self.init();
            self.box.destroy();
        }, time);
    };
    Player.prototype.setChips = function (amount) {
        if (this.chipsText) this.chipsText.destroy();
        amount = parseInt(amount);
        this.chips = amount;
        var style = {font: "10px Arial", fill: "#F3C665", align: "center"};
        var text = this.game.add.text(0, 2, amount, style);
        text.anchor.set(0.5);
        var bitmap = this.game.add.bitmapData(text.width + 30, 15);
        bitmap.context.strokeStyle = "#FED76D";
        bitmap.context.fillStyle = "#0000";
        bitmap.context.myRoundRect(0, 0, text.width + 30, 15, 5, true);
        bitmap.alpha = 0.5;
        this.chipsText = this.game.add.sprite(0, 40, bitmap);
        this.chipsText.addChild(text);
        this.chipsText.anchor.set(0.5);
        this.box.addChild(this.chipsText);
    };
    Player.prototype.setStatus = function (status) {
        if (!status) return;
        if (this.statusText) this.statusText.destroy();
        var style = {font: "10px Arial", fill: "#67A1C5", align: "center"};
        var text = this.game.add.text(0, 2, status+'', style);
        text.anchor.set(0.5);
        var bitmap = this.game.add.bitmapData(text.width + 30, 15);
        bitmap.context.strokeStyle = "#FED76D";
        bitmap.context.fillStyle = "#0000";
        bitmap.context.myRoundRect(0, 0, text.width + 30, 15, 5, true);
        bitmap.alpha = 0.5;
        this.statusText = this.game.add.sprite(0, 58, bitmap);
        this.statusText.addChild(text);
        this.statusText.anchor.set(0.5);
        this.box.addChild(this.statusText);
    };
    Player.prototype.addCard = function (card) {
        if (!card) {
            card = 'CardBack';
        }
        var pos = PlayerMap[this.seat].card;
        var sprite = this.game.add.sprite(this.game.world.centerX + pos[0] + this.hands.length * 20, this.game.world.centerY + pos[1], card);
        sprite.scale.set(0.75);
        sprite.anchor.set(0.5);
        this.hands.push(sprite);
    };
    Player.prototype.hit = function (card) {
        var self = this;
        var sprite = this.game.add.sprite(this.game.world.centerX + ShoeMap[0], this.game.world.centerY + ShoeMap[1], 'CardBack');
        sprite.anchor.set(0.5);
        sprite.angle = -85;
        var pos = PlayerMap[this.seat].card;
        var tween = this.game.add.tween(sprite).to({
            x: self.game.world.centerX + pos[0] + self.hands.length * 20,
            y: self.game.world.centerY + pos[1],
            angle: 0
        }, 350, Phaser.Easing.Linear.None, true);
        this.game.add.tween(sprite.scale).to({x: 0.75, y: 0.75}, 350, Phaser.Easing.Linear.None, true);
        this.hands.push(sprite);
        tween.onComplete.add(function () {
            //sprite.flipX = true;
            if (card)
                sprite.loadTexture(card, '');
        }, this.game);
        if (!this.game.game.isStopSound)
            self.game.dealSound.play();
    };
    Player.prototype.showCards = function (cardList) {
        if (!cardList) return;
        for (var i = 0; i < cardList.length; i++) {
            this.addCard(cardList[i]);
        }
    };
    //统计筹码数量
    Player.prototype.totalChips = function () {
        if (this.wagerText) this.wagerText.destroy();
        var amount = 0;
        for (var i = 0; i < this.wagers.length; i++) {
            amount += this.wagers[i].value;
        }
        if (this.wagerText) this.wagerText.destroy();
        // var style = {font: "12px Arial", fill: "rgb(255, 255, 255)", align: "left"};
        // this.wagerText = this.game.add.text(0, 0, amount + '', style);
        // var pos = PlayerMap[this.seat].wagerText;
        // this.wagerText.x = this.game.world.centerX + pos[0];
        // this.wagerText.y = this.game.world.centerY + pos[1];

        var style = {font: "10px Arial", fill: "#fff", align: "center"};
        var text = this.game.add.text(0, 2, amount+'', style);
        text.anchor.set(0.5);
        var bitmap = this.game.add.bitmapData(text.width + 10, 15);
        bitmap.context.strokeStyle = "#FED76D";
        bitmap.context.fillStyle = "#3c3c3c";
        bitmap.context.myRoundRect(0, 0, text.width + 10, 15, 5, true);
        bitmap.alpha = 0.5;
        this.wagerText = this.game.add.sprite(0, 0, bitmap);
        this.wagerText.addChild(text);
        this.wagerText.anchor.set(0.5);
        var pos = PlayerMap[this.seat].wagerText;
        this.wagerText.x = this.game.world.centerX + pos[0] + 10;
        this.wagerText.y = this.game.world.centerY + pos[1];
    };
    Player.prototype.getChipsCount = function(){
        var amount = 0;
        for (var i = 0; i < this.wagers.length; i++) {
            amount += this.wagers[i].value;
        }
        return amount;
    };
    //显示筹码列表
    Player.prototype.showChips = function (betList) {
        var amount = 0, sprite, index, bet;
        for (var a = 0; a < betList.length; a++) {
            bet = betList[a];
            index = getChipIndex(bet);
            sprite = this.parent.addChips(PlayerMap[this.seat].wager, index);
            sprite.y -= this.wagers.length * 3;
            sprite.scale.set(0.3);
            sprite.value = bet;
            this.wagers.push(sprite);
            amount += bet;
        }
        this.totalChips();
    };
    Player.prototype.bet = function (chips) {
        var self = this;
        var amount = HoldemShare.GetChipSize(chips);
        chips.forEach(function(chip){
            var index = getChipIndex(chip);
            var sprite = self.parent.addChips(PlayerMap[self.seat].card, index);
            sprite.scale.set(0.5);
            sprite.value = ChipMap[index][2];
            var pos = PlayerMap[self.seat].wager;
            var y = Math.floor(0+Math.random()*20);
            var x = Math.floor(-20+Math.random()*30);
            if (self.seat == 'player0')
                x -= 5, y -= 5;
            else if (self.seat == 'player1')
                x += 15, y -= 20;
            else if (self.seat == 'player2')
                x += 15, y -= 0;
            else if (self.seat == 'player4')
                x -= 15, y -= 0;
            else if (self.seat == 'player5')
                x -= 15, y -= 0;
            else if (self.seat == 'player7')
                x -= 0, y -= 15;
            else if (self.seat == 'player8')
                x += 15, y -= 7;
            var tween = self.game.add.tween(sprite).to({
                x: self.game.world.centerX + pos[0] - x,
                y: self.game.world.centerY + pos[1] - y
                // x: self.game.world.centerX + pos[0],
                // y: self.game.world.centerY + pos[1] - self.wagers.length * 3
            }, 350, Phaser.Easing.Linear.None, true);
            self.game.add.tween(sprite.scale).to({x: 0.3, y: 0.3}, 350, Phaser.Easing.Linear.None, true);
            self.wagers.push(sprite);
        });
        this.setChips(this.chips-amount);
        this.totalChips();
    };
    Player.prototype.moveToPot = function () {
        var self = this;
        this.wagers.forEach(function(sprite){
            var index = getChipIndex(sprite.value);
            var pos = TableMap.wager;
            var y = Math.floor(0+Math.random()*20);
            var x = Math.floor(-20+Math.random()*30);
            var tween = self.game.add.tween(sprite).to({
                x: self.game.world.centerX + pos[0] - x,
                y: self.game.world.centerY + pos[1] - y
                // y: self.game.world.centerY + pos[1] - self.wagers.length * 3
            }, 350, Phaser.Easing.Linear.None, true);
            self.game.add.tween(sprite.scale).to({x: 0.3, y: 0.3}, 350, Phaser.Easing.Linear.None, true);
            self.parent.wagers.push(sprite);
        });
        self.wagers = [];
        if (this.wagerText){
            this.wagerText.destroy();
            this.wagerText = undefined;
        }
    };

    function Game(game){
        this.game = game;
        this.PlayerObjs = {};
        this.socket = game.game.socket;
        this.$translate = game.game.$translate;
        this.domain = document.domain;
        this.port = 9000;
        this.hands = [];
        this.wagers = [];
        this.timer = null;
        //this.Tools();
        this.client();
        this.initEvent();
    };
    Game.prototype.initEvent = function(){
        var self = this;
        $('.Down').click(function(){
            var id = $(this).parent().attr('id');
            var seat = (id+'').split('Player')[1];
            self.socket.emit('join', seat);
        });
        $('.Join').click(function(){
            $(this).hide();
            self.socket.emit('join', null);
        });
        $('.Check').click(function(){
            self.socket.emit('check', null);
            $('.Actions .Start').hide();
        });
        $('.Call').click(function(){
            self.socket.emit('call', null);
            $('.Actions .Start').hide();
        });
        $('.AllIn').click(function(){
            self.socket.emit('raise', -1);
            $('.Actions .Start').hide();
        });
        $('.Fold').click(function(){
            self.socket.emit('fold', null);
            $('.Actions .Start').hide();
        });
        $('.Raise').click(function(){
            var chips = parseFloat($('.Raise .Amount').text());
            self.socket.emit('raise', chips);
            $('.Actions .Start').hide();
        });
        $('.StandUp').click(function(){
            self.socket.emit('standup');
        });
        $('.Buy').click(function(){
            self.socket.emit('buy');
        });
        $('.roomBtn').click(function(){
            $('.Room').hide();
            self.socket.emit('showroom', null);
        });
        $('.ToLast').click(function(){
            //self.rating(10);
        });

        $('.Chat input').keydown(function(event) {
            if(13 == event.keyCode) {
                self.SendMessage();
            }
        });
        $('.Chat button').click(function(){
            self.SendMessage();
        });
        $('.Main').click(function(){
            $('.Room').hide();
        });
    };
    Game.prototype.SendMessage = function(){
        var msg = $('.Chat input').val();
        if (!msg) return;
        this.socket.emit('chat', msg);
        $('.Chat input').val('');
    };
    Game.prototype.setTableInfo = function (data) {
        $('.Info .Table').text(data['roomName']);
        $('.Info .Blind').text(data['blind']/2 + ' / ' + data['blind']);
        //table info
        var tableInfo = '\n\
        Table:'+data['roomName']+'\n\
        Blind:'+data['blind']/2+'/'+data['blind']+'\n\
        Fee:0.8%';
        if (this.tableInfoText)
        {
            this.tableInfoText.setText(tableInfo);
        }
        else
        {
            var style = {font: "14px Arial", fill: "#fff"};
            this.tableInfoText = this.game.add.text(this.game.world.centerX-400, this.game.world.centerY-offset-250, tableInfo, style);
        }

    };
    Game.prototype.moveDealer = function (nextPlayer) {
        nextPlayer = 'player'+nextPlayer
        var pos = PlayerMap[nextPlayer].dealer;
        var tween = this.game.add.tween(this.game.dealer).to({
            x: this.game.world.centerX + pos[0],
            y: this.game.world.centerY + pos[1]
        }, 700, Phaser.Easing.Linear.None, true);
    };
    Game.prototype.rating = function(min){
        var self = this;
        $('.Rating').slidy({
            width:70,
            theme: {
                image: '/public/lib/rating/my.png',
                width: 70,
                height: 42
            },
            maxval: 20, interval: 1, defaultValue: 1,
            finishedCallback: function (value) {
                var player = self.PlayerObjs[self.myUserName];
                if (!player) return;
                var amount = parseInt(player.getChipsCount());
                var balance = parseInt(player.chips);
                balance += amount;
                var rate = min+(balance - min)/19*(value-1);
                $('.Raise .Amount').text(parseInt(rate));
            }
        });
    };
    Game.prototype.countDown = function(seat, n)
    {
        if (this.countDownText)
        {
            this.countDownText.setText(n+'');
        }
        else {
            var style = {font: "30px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center"};
            var pos = PlayerMap[seat].seat;
            this.countDownText = this.game.add.text(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], n+'', style);
            this.countDownText.anchor.set(0.5);
        }
    };
    Game.prototype.closeCountDown = function()
    {
        clearInterval(this.timer);
        if (this.countDownText) this.countDownText.destroy();
        this.countDownText = undefined;
    };
    Game.prototype.turn = function(data){
        console.log('turn', data);
        var player = this.PlayerObjs[data.username];
        if (!player) return;
        //清除上个玩家的倒计时
        this.closeCountDown();

        var self = this;
        var time = 15;
        this.countDown(player.seat, time);
        this.timer = setInterval(function(){
            time--;
            self.countDown(player.seat, time);
            if (time <= 0)
            {
                self.closeCountDown();
            }
        }, 1000);

        $('.Start').hide();
        if (data.username == this.myUserName)
        {
            this.game.myTurnSound.play();
            var player = this.PlayerObjs[data.username];
            $('.Start').show();
            $('.AllIn').hide();
            $('.Fold').hide();
            $('.Check').hide();
            $('.Call').hide();
            $('.RaiseFrame').hide();
            //如果有加注
            if (data.addChips.toFloat() > 0 && data.addChips >= player.chips)
            {
                $('.AllIn').show();
                $('.Fold').show();
            }
            else{
                if (data.addChips.toFloat() > 0)
                {
                    $('.Call').show();
                    $('.Call .Amount').text(data.addChips.toFloat());
                }
                else
                    $('.Check').show();
                $('.Fold').show();
                $('.RaiseFrame').show();
                $('.Raise').show();
                $('.Raise .Amount').text(parseInt(data.raiseChips));
                this.rating(parseInt(data.raiseChips));
            }
        }
    };
    Game.prototype.doFlip = function (sprite, card) {
        this.game.flopSound.play();
        sprite.loadTexture(card, '');
    };
    Game.prototype.addChips = function (pos, index) {
        var wager = this.game.add.sprite(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], 'wager', index);
        wager.inputEnabled = true;
        return wager;
    };
    Game.prototype.addChat = function(username, text){
        var player = this.PlayerObjs[username];
        var color = 'none';
        if (player)
            color = PlayerMap[player.seat].color;
        $('.Chat ul').append('<li><span class="UserName" style="color:'+color+';">'+username+'</span> '+text+'</li>');
        $(".nano").nanoScroller();
        $(".nano").nanoScroller({ scroll: 'bottom' });
    }
    Game.prototype.bet = function(data){
        var username = data.username;
        var chips = data.chips;
        var amount = HoldemShare.GetChipSize(data.chips);
        var position = data.position;

        this.game.betSound.play();
        var player = this.PlayerObjs[username];
        player.bet(chips);
        if (data.position)
            player.setStatus(this.$translate.instant(data.position));
    };
    Game.prototype.showPotCards = function(card)
    {
        var pos = TableMap.card;
        var sprite = this.game.add.sprite(this.game.world.centerX + pos[0] + this.hands.length * 60 + 10, this.game.world.centerY + pos[1], card);
        sprite.scale.set(0.75);
        sprite.anchor.set(0.5);
        this.hands.push(sprite);
    };
    Game.prototype.getCardType = function(username){
        var player = this.PlayerObjs[username];
        var myHands = player?player.hands:[];
        var tableHands = this.hands;
        if (myHands.length == 2 && tableHands.length >= 3)
        {
            var tableCards = [];
            var myCards = [];
            for (var i = 0; i < myHands.length; i++)
            {
                var data = myHands[i].key;
                myCards.push(data);
            }
            for (var i = 0; i < tableHands.length; i++)
            {
                var data = tableHands[i].key;
                tableCards.push(data);
            }
            var cardType, temp;
            //显示牌型
            try{
                temp = HoldemShare.EvaluateHand(tableCards, myCards);
                if (temp && typeof temp.handType != 'undefined')
                    cardType = temp.handType;
            }catch (e){}
            console.log(temp);
            return cardType;
        }
    };
    Game.prototype.showCardType = function(){
        var cardType = this.getCardType(this.myUserName);
        if (!cardType) return;
        cardType = this.$translate.instant(cardType);
        var pos = TableMap.cardType;
        if (this.CardTypeText) this.CardTypeText.destroy();
        var style = {font: "10px Arial", fill: "#fff", align: "center"};
        var text = this.game.add.text(0, 2, cardType+'', style);
        text.anchor.set(0.5);
        var bitmap = this.game.add.bitmapData(text.width + 10, 15);
        bitmap.context.strokeStyle = "#3c3c3c";
        bitmap.context.fillStyle = "#3c3c3c";
        bitmap.context.myRoundRect(0, 0, text.width + 10, 15, 5, true);
        this.CardTypeText = this.game.add.sprite(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], bitmap);
        this.CardTypeText.addChild(text);
        this.CardTypeText.anchor.set(0.5);
    };
    Game.prototype.totalChips = function () {
        if (this.wagerText) this.wagerText.destroy();
        var amount = 0;
        for (var i = 0; i < this.wagers.length; i++) {
            amount += this.wagers[i].value;
        }

        var style = {font: "10px Arial", fill: "#fff", align: "center"};
        var text = this.game.add.text(0, 2, amount+'', style);
        text.anchor.set(0.5);
        var bitmap = this.game.add.bitmapData(text.width + 10, 15);
        bitmap.context.strokeStyle = "#FED76D";
        bitmap.context.fillStyle = "#3c3c3c";
        bitmap.context.myRoundRect(0, 0, text.width + 10, 15, 5, true);
        bitmap.alpha = 0.5;
        this.wagerText = this.game.add.sprite(0, 0, bitmap);
        this.wagerText.addChild(text);
        this.wagerText.anchor.set(0.5);

        var pos = TableMap.wagerText;
        this.wagerText.x = this.game.world.centerX + pos[0];
        this.wagerText.y = this.game.world.centerY + pos[1];
    };
    Game.prototype.showPotChips = function(chips){
        var amount = 0, sprite, index, bet;
        for (var a = 0; a < chips.length; a++) {
            bet = chips[a];
            index = getChipIndex(bet);
            sprite = this.addChips(TableMap.wager, index);
            //sprite.y -= this.wagers.length * 3;
            sprite.y -= Math.floor(0+Math.random()*30);
            sprite.x -= Math.floor(-20+Math.random()*40);
            sprite.scale.set(0.3);
            sprite.anchor.set(0.5);
            sprite.value = bet;
            this.wagers.push(sprite);
            amount += bet;
        }
        this.totalChips();
        //var p = $("#PotFlop .Pot");
        //for (var c = 0; c < chips.length; c++) {
        //    var chip = chips[c];
        //    chip = ('Bet'+chip).replace('.', '_');
        //    p.append('<span class="ChipSm ' + chip + '" data="ok"></span>');
        //    var t = $('.ChipSm.' + chip, p).last();
        //    $('.ChipSm.' + chip, p).last().css({
        //        top: -($('.ChipSm', p).length - 1) * 2,
        //        left : 0
        //    })
        //    this.potHands.push(t);
        //}
    };
    //将每个用户的筹码称到奖池
    Game.prototype.allChipsMovePot = function()
    {
        this.game.moveChipsSound.play();
        var self = this;
        for (var username in this.PlayerObjs)
        {
            player = this.PlayerObjs[username];
            player.moveToPot();
        }
        setTimeout(function(){
            self.totalChips();
        }, 900); 
    };
    Game.prototype.hit = function(card)
    {
        var self = this;
        var sprite = this.game.add.sprite(this.game.world.centerX + ShoeMap[0], this.game.world.centerY + ShoeMap[1], 'CardBack');
        sprite.anchor.set(0.5);
        sprite.angle = -85;
        var pos = TableMap.card;
        var tween = this.game.add.tween(sprite).to({
            x: self.game.world.centerX + pos[0] + self.hands.length * 60 + 10,
            y: self.game.world.centerY + pos[1],
            angle: 0
        }, 350, Phaser.Easing.Linear.None, true);
        this.game.add.tween(sprite.scale).to({x: 0.75, y: 0.75}, 350, Phaser.Easing.Linear.None, true);
        this.hands.push(sprite);
        tween.onComplete.add(function () {
            //sprite.flipX = true;
            if (card)
                sprite.loadTexture(card, '');
            setTimeout(function(){
                self.showCardType();
            }, 100);
        }, this.game);
        if (!this.game.game.isStopSound)
            self.game.dealSound.play();

        // this.showCardType();
    };
    Game.prototype.winChips = function(username, balance){
        var self = this;
        this.game.moveChipsSound.play();
        var player = this.PlayerObjs[username];
        this.wagers.forEach(function(wager){
            var index = getChipIndex(wager);
            var pos = PlayerMap[player.seat].seat;
            var tween = self.game.add.tween(sprite).to({
                x: self.game.world.centerX + pos[0],
                y: self.game.world.centerY + pos[1] - self.wagers.length * 3
            }, 700, Phaser.Easing.Linear.None, true);
            // self.game.add.tween(sprite.scale).to({x: 0.3, y: 0.3}, 700, Phaser.Easing.Linear.None, true);
            tween.onComplete.add(function () {
                wager.destroy();
            }, self.game);
        });
        setTimeout(function(){
            player.setChips(balance);
        }, 700);
    };
    Game.prototype.potMoveUser = function(username, chips, balance){
        var self = this;
        this.game.moveChipsSound.play();
        this.wagerText.destroy();
        var player = this.PlayerObjs[username];
        var pos = PlayerMap[player.seat].seat;
        chips.forEach(function(chip){
            for (var i = 0; i < self.wagers.length; i++)
            {
                var item = self.wagers[i]; 
                if (item.value == chip)
                {
                    var tween = self.game.add.tween(item).to({
                        x: self.game.world.centerX + pos[0],
                        y: self.game.world.centerY + pos[1]
                    }, 700, Phaser.Easing.Linear.None, true);
                    // self.game.add.tween(chip.scale).to({x: 0.3, y: 0.3}, 700, Phaser.Easing.Linear.None, true);
                    tween.onComplete.add(function () {
                        item.destroy();
                    }, self.game);
                    _.remove(self.wagers, item);
                    break;
                }
            }

        });
        setTimeout(function(){
            player.setChips(balance);
        }, 700);
    }
    Game.prototype.initPlayer = function(){
        this.hands.forEach(function(item){
            item.destroy();
        });
        this.wagers.forEach(function(item){
            item.destroy();
        });
        this.hands = [];
        this.wagers = [];
        if (this.wagerText) {
            this.wagerText.destroy();
            this.wagerText = undefined;
        }
        if (this.CardTypeText) {
            this.CardTypeText.destroy();
            this.CardTypeText = undefined;
        }

        for (var username in this.PlayerObjs)
        {
            var player = this.PlayerObjs[username];
            player.init();
        }
    };
    Game.prototype.standUp = function(username){
        var player = this.PlayerObjs[username];
        player.destroy();
        delete this.PlayerObjs[username];

        //站起后 为了不让玩家马上加入游戏 影响界面
        if (username == this.myUserName)
        {
            setTimeout(function(){
                $('.Join').show();
            }, 3000);
            $('.Start').hide();
            $('.StandUp').attr('disabled', true);
            $('.Buy').attr('disabled', true);
            this.isPlaying = false;
        }
    };
    Game.prototype.clear = function(){
        this.hands.forEach(function(item){
            item.destroy();
        });
        this.wagers.forEach(function(item){
            item.destroy();
        });
        this.hands = [];
        this.wagers = [];
        for (var username in this.PlayerObjs)
        {
            var player = this.PlayerObjs[username];
            player.init();
            player.destroy();
        }
        this.PlayerObjs = [];
        if (this.CardTypeText)
        {
            this.CardTypeText.destroy();
            this.CardTypeText = undefined;
        }
        if (this.wagerText)
        {
            this.wagerText.destroy();
            this.wagerText = undefined;
        }
        this.closeCountDown();
    };
    Game.prototype.connectStatus = function(text){
        this.connectStatusText && this.connectStatusText.destroy();
        var style = {font: "20px Arial", fill: "#fff", stroke: "#333", strokeThickness: 2, align: "center"};
        this.connectStatusText = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 20, text, style);
        this.connectStatusText.anchor.set(0.5);
    };
    Game.prototype.client = function () {
        var self = this;
        self.connectStatus('connecting...');
        this.socket.connect(HoldemServer);
        this.socket.on('connect', function (data) {
            if (self.connectStatusText){
                self.connectStatusText.destroy();
                self.connectStatusText = undefined;
            }
            $('.Actions .Join').hide();
            $('.Actions .Start').hide();
            var roomid = $.cookie('holdem_room');
            if (roomid)
            {
                setTimeout(function(){self.socket.emit('init', {roomId:roomid})}, 300);
            }
            else
                setTimeout(function(){self.socket.emit('showroom', null)}, 300);
        });
        this.socket.on('connect_error', function () {
            self.connectStatus('connecting...');
        });
        this.socket.on('disconnect', function () {
            self.connectStatus('connecting...');
        });
        this.socket.on('error', function () {
            //self.connectStatus('connecting...');
        });
        this.socket.on('msg', function (data) {
            self.message(data.msg, 3);
        });
        this.socket.on('init', function (data) {
            console.log('init', data);
            self.clear();
            $('.Room').hide();
            $('.Join').show();
            self.myUserName = data.myUserName;
            $('.Tool .MyBalance').text(data['myBalance'].toFixedEx(8));
            $('.TotalChips').text(data['totalChips']);
            var coin;
            if (data['coin'] == 'BitCoin')
                coin = 'u';
            else if (data['coin'] == 'LiteCoin')
                coin = 'm';
            else
                coin = '';
            var shortCoin = share.coinToShortName(data['coin']);
            coin += shortCoin;
            $('.Coin').first().text(shortCoin);
            $('.Coin').last().text(coin);
            $('#coinImg').attr('src', '/public/images/coin/'+share.coinToShortName(data['coin']).toLocaleLowerCase()+'.png');
            self.setTableInfo(data);

            for (var i = 0; i < data.player.length; i++)
            {
                var item = data.player[i];
                if (item)
                {
                    var player = self.PlayerObjs[item.name] = new Player(self, item.seat, item.name, item.totalChips, self.$translate.instant(item.status));
                    player.showCards(item.cardList);
                    if (item.chips.length > 0)
                    {
                        player.showChips(item.chips);
                    }
                    //如果总筹码小于等于0 奖池等于0 说明游戏还没开始
                    if (item.name == self.myUserName && item.totalChips < data['blind'] && data['table']['pot'] == 0)
                        $('.Buy').attr('disabled', true);
                    if (item.name == self.myUserName)
                    {
                        $('.Join').hide();
                        $('.StandUp').attr('disabled', false);
                    }
                }
            }

            var tableCards = data['table'].flop;
            for (var m = 0; m < tableCards.length; m++)
                self.showPotCards(tableCards[m]);
            self.showCardType();
            var pot = data['table']['pot'];
            if (pot.length > 0)
            {
                self.showPotChips(pot);
            }

            // self.moveDealer(data.dealer);
            if (data.turn) self.turn(data.turn);

            // for (var i = 0; i < 9; i++)
            // {
            //     var player = self.PlayerObjs['near'+i] = new Player(self, i, 'near'+i, 1000, self.$translate.instant('wait'));
            //     player.bet([100, 1, 100, 1, 10, 1,1,1,1,1,10,10,100,1,1,1,1]);
            // }
        });
        self.socket.on('records', function(data){
            $('.Record ul li').remove();
            for (var i = 0; i < data.length; i++)
            {
                var item = data[i];
                self.addRecords(item[0], item[1]);
            }
        });
        self.socket.on('chats', function(data){
            $('.Chat ul li').remove();
            for (var i = 0; i < data.length; i++)
            {
                var item = data[i];
                self.addChat(item[0], item[1]);
            }
        });
        self.socket.on('chat', function(data){
            self.addChat(data[0], data[1]);
        });
        self.socket.on('deal', function(data){
            console.log('deal', data);
            var username = data.username;
            var cards = data.cardList;
            var player = self.PlayerObjs[username];
            var i = 0;
            cards.forEach(function(card){
                setTimeout(function() {
                    self.game.dealSound.play();
                    player.hit(card);
                }, i * 1050);
                i++;
            });
        });
        self.socket.on('table', function(data){
            self.allChipsMovePot();
            for (var i = 0; i < data.length; i++) {
                (function(i) {
                    setTimeout(function() {
                        self.game.dealSound.play();
                        self.hit(data[i]);
                    }, i * 1050)
                })(i);
            }
        });
        self.socket.on('turn', function(data){
            self.turn(data);
        });
        self.socket.on('dealer', function(data){
            console.log('dealert', data);
            self.initPlayer();
            self.moveDealer(data);
        });
        self.socket.on('bet', function(data){
            console.log('bet', data);
            self.bet(data);
        });
        self.socket.on('call', function(data){
            console.log('call', data);
            self.bet(data);
        });
        self.socket.on('raise', function(data){
            console.log('raise', data);
            self.bet(data);
        });
        self.socket.on('allin', function(data){
            console.log('allin', data);
            self.bet(data);
        });
        self.socket.on('status', function(data){
            console.log(data, new Date().getTime());
            var player = self.PlayerObjs[data.name];
            //try {
                if (data.status == 'wait' && typeof data.seat != "undefined") {
                    player = self.addPlayer(data);
                    self.addRecords(data.name, ['join the game']);
                    if (data.name == self.myUserName)
                        $('.Tool .MyBalance').text(data.myBalance.toFloat());
                }
                else if (data.status == 'check') {
                    self.game.checkSound.play();
                    self.addRecords(data.name, [data.status]);
                }
                else if (data.status == 'fold') {
                    self.game.foldSound.play();
                    self.addRecords(data.name, [data.status]);
                }
                else if (data.status == 'call') {
                    self.addRecords(data.name, [data.status, data.amount.toFloat()]);
                }
                else if (data.status == 'raise') {
                    self.addRecords(data.name, [data.status, data.amount.toFloat()]);
                }
                else if (data.status == 'allin') {
                    self.addRecords(data.name, [data.status, data.amount.toFloat()]);
                }
                else if (data.status == 'standup') {
                    self.addRecords(data.name, [data.status]);
                    self.standUp(data.name);
                    if (data.name == self.myUserName)
                        $('.Tool .MyBalance').text(data.myBalance.toFloat());
                }
                else if (data.status == 'wait')
                    $('.Win').removeClass('Win');
                else if (data.name == self.myUserName && data.status == 'out')
                    $('.Buy').attr('disabled', true);
                else if (data.status == 'buy')
                {
                    self.addRecords(data.name, [data.status, data.amount.toFloat()]);
                    player.setChips(data.totalChips);
                    //obj.find('.Balance').text((data.totalChips).toFloat()).show();
                    if (data.name == self.myUserName)
                    {
                        $('.Tool .MyBalance').text(data.myBalance.toFloat());
                        $('.Buy').attr('disabled', false);
                    }
                }
                if (player)
                    player.setStatus(self.$translate.instant(data.status));
            //}catch (e){
            //    console.log(data.status, e);
            //}
        });
        self.socket.on('winner', function(data){
            self.closeCountDown();
            self.addRecords(data.username, [data.cardType, 'win', data.amount.toFloat()]);
            $('.Start').hide();

            var winCards = data.winningHand || [];
            var cards = data.hand || [];
            var player = self.PlayerObjs[data.username];
            var hands = player.hands;
            for (var i = 0; i < hands.length; i++)
            {
                var c = hands[i];
                if (c && cards[i])
                {
                    self.doFlip(c, cards[i]);
                }
            }
            //标记赢的牌
            var key;
            for (var i = 0; i < winCards.length; i++)
            {
                var c = winCards[i];
                for (var n = 0; n < self.hands.length; n++)
                {
                    key = self.hands[n].key;
                    if (c[0] == key[0] && c[1] == key[1]) self.hands[n].y -= 6;
                }
                // $('.Card[data="'+c[0]+'-'+c[1]+'"]').css('top', '-6px');
            }
            console.log('winner', data);

            var time = 0;
            var isMovePot = false;
            //检测是否还有玩家筹码没放到奖池
            for (var username in self.PlayerObjs)
            {
                player = self.PlayerObjs[username];
                if (player.wagers.length > 0)
                    isMovePot = true;
            }
            if (isMovePot)
            {
                self.allChipsMovePot();
                time = 1200;
            }
            //给没放入奖池的一点时间
            setTimeout(function(){
                if (!data.chips)
                    self.winChips(data.username, data.totalChips);
                else
                    self.potMoveUser(data.username, data.chips, data.totalChips);

                var cardType = '';
                if (data.cardType)
                    cardType = data.cardType + ' ';
                player = self.PlayerObjs[data.username];
                player.setStatus(self.$translate.instant(cardType)+' '+self.$translate.instant('win'));
            }, time);
        });
        self.socket.on('refund', function(data){
            console.log('refund', data);
            self.potMoveUser(data.username, data.chips, data.totalChips);
        })
        self.socket.on('clear', function(data){
            console.log('clear', data);
            self.initPlayer();
        });
        self.socket.on('roomList', function(data){
            var obj = $('.Room tbody');
            obj.find('tr').remove();
            var item;
            for (var i = 0; i < data.length; i++)
            {
                item = data[i];
                var str = item.coin=='TestCoin'?'-德州大赛':'';
                var coin;
                if (item.coin == 'BitCoin')
                    coin = 'u';
                else if (item.coin == 'LiteCoin')
                    coin = 'm';
                else
                    coin = '';
                var shortCoin = share.coinToShortName(item.coin);
                coin += shortCoin;
                obj.append('<tr data="'+item.roomID+'"><td>'+item.roomName+'</td><td>'+item.blind/2+'/'+item.blind+'</td><td>'+item.online+'/'+item.playerNumber+'</td><td>'+item.chip+'('+coin+str+')</td></tr>')
            }
            obj.find('tr').click(function(){
                var id = $(this).attr('data') || 1;
                $.cookie('holdem_room', id, {path:'/'});
                $('.Record ul li').remove();
                $('.Chat ul li').remove();
                $('.RaiseFrame').hide();
                $('.AllIn').hide();
                $('.Fold').hide();
                $('.Check').hide();
                $('.Call').hide();
                self.socket.emit('init', {roomId:id});
            });
            $('.Room').show();
        });
    };
    Game.prototype.message = function (text, timeout) {
        var style = {font: "bold 30px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center"};
        var t = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 30, text, style);
        t.anchor.set(0.5);
        t.scale.set(0.5);
        var tween = this.game.add.tween(t.scale).to({x: 1, y: 1}, 700, Phaser.Easing.Linear.None, true);
        tween.onComplete.add(function () {
            setTimeout(function () {
                t.destroy();
            }, timeout * 1000);
        }, this.game);
    };
    Game.prototype.addPlayer = function(data){
        if (data.name == this.myUserName)
        {
            this.isPlaying = true;
            $('.StandUp').attr('disabled', false);
            $('.Join').hide();
        }

        this.PlayerObjs[data.name] = new Player(this, data.seat, data.name, data.totalChips, this.$translate.instant(data.status));
        return this.PlayerObjs[data.name];
    };
    Game.prototype.addRecords = function(username, list){
        var text = '';
        for (var i = 0; i < list.length; i++)
        {
            if (!list[i]) continue;
            text += this.$translate.instant(list[i]+'')+' ';
        }
        var player = this.PlayerObjs[username];
        var color = 'none';
        if (player)
            color = PlayerMap[player.seat].color;
        $('.Record ul').append('<li><span class="UserName" style="color:'+color+';">'+username+'</span> '+text+'</li>');
        $(".nano").nanoScroller();
        $(".nano").nanoScroller({ scroll: 'bottom' });
    };

    var offset = 40;
    var Holdem = {};
    //引导 创建界面
    Holdem.Boot = function(game){};
    Holdem.Boot.prototype = {
        preload: function(){
            this.load.image('preloaderBar', '/games/blackjack/images/loading-bar.png');
        },
        create: function(){
            this.input.maxPointers = 1;
            this.physics.startSystem(Phaser.Physics.ARCADE);
            //this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
            this.scale.setScreenSize(true);
            this.state.start('Preloader');
        }
    };

    Holdem.Preloader = function(game){
        this.GAME_WIDTH = $('#HoldemFrame').innerWidth();
        this.GAME_HEIGHT = $('#HoldemFrame').innerHeight();
    };
    Holdem.Preloader.prototype = {
        preload: function(){
            this.stage.backgroundColor = '#000';
            this.preloadBar = this.add.sprite((this.GAME_WIDTH-311)/2, (this.GAME_HEIGHT-27)/2, 'preloaderBar');
            this.load.setPreloadSprite(this.preloadBar);
            this.load.image('background', '/games/holdem/images/background2.png');
            this.load.image('table', '/games/holdem/images/table.png');
            this.load.spritesheet('wager', '/games/blackjack/images/wager.png', 73, 59);
            this.load.image('dealer', '/games/holdem/images/dealer.png');
            this.load.image('dealer_seat', '/games/holdem/images/dealer_seat.png');
            this.load.image('seat1', '/games/holdem/images/seat1.png');
            this.load.image('seat2', '/games/holdem/images/seat2.png');
            this.load.image('seat3', '/games/holdem/images/seat3.png');
            this.load.image('seat4', '/games/holdem/images/seat4.png');
            this.load.image('seat5', '/games/holdem/images/seat5.png');
            this.load.image('down', '/games/holdem/images/down.png');
            this.load.image('d', '/games/holdem/images/d.png');
            this.load.image('box', '/games/holdem/images/box.png');
            this.load.image('face', '/games/holdem/images/face.png');

            this.load.audio('dealSound', '/games/holdem/sound/deal.ogg');
            this.load.audio('checkSound', '/games/holdem/sound/check.ogg');
            this.load.audio('flopSound', '/games/holdem/sound/flop.ogg');
            this.load.audio('foldSound', '/games/holdem/sound/fold.ogg');
            this.load.audio('betSound', '/games/holdem/sound/bet.ogg');
            this.load.audio('myTurnSound', '/games/holdem/sound/myturn.ogg');
            this.load.audio('moveChipsSound', '/games/holdem/sound/movechips.ogg');

            //this.load.spritesheet('action', '/games/blackjack/images/action.png', 74, 70);
            //this.load.spritesheet('tools', '/games/blackjack/images/tools.png', 32, 32);
            //提前生成牌资源
            initCards(this);
        },
        create: function(){
            // start the MainMenu state
            this.state.start('MainMenu');
        }
    };
    Holdem.MainMenu = function(game){};
    Holdem.MainMenu.prototype = {
        create: function(){
            var self = this;
            this.physics.startSystem(Phaser.Physics.ARCADE);
            // display images
            this.GAME_WIDTH = $('#HoldemFrame').innerWidth();
            this.GAME_HEIGHT = $('#HoldemFrame').innerHeight();
            var background = this.add.tileSprite(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT, 'background');
            var dealer_seat = this.add.sprite(this.game.world.centerX, this.game.world.centerY-offset-160, 'dealer_seat');
            dealer_seat.anchor.set(0.5);
            var seat, down, i = 0, n = 0;
            for (var player in PlayerMap)
            {
                if (i > 4)
                    n--;
                else
                    n++;
                seat = this.add.sprite(this.game.world.centerX+PlayerMap[player].seat[0], this.game.world.centerY-offset+PlayerMap[player].seat[1], 'seat'+n);
                seat.anchor.set(0.5);
                if (i > 4)
                    seat.scale.set(-1, 1);
                down = this.add.sprite(this.game.world.centerX+PlayerMap[player].seat[0], this.game.world.centerY-offset+PlayerMap[player].seat[1], 'down');
                down.anchor.set(0.5);
                down.inputEnabled = true;
                down.input.useHandCursor = true;
                i++;
            }
            var table = this.add.sprite(this.game.world.centerX, this.game.world.centerY-offset, 'table');
            table.anchor.set(0.5);
            var dealer = this.add.sprite(this.game.world.centerX, this.game.world.centerY-offset-170, 'dealer');
            dealer.anchor.set(0.5);

            this.dealSound = this.add.audio('dealSound');
            this.checkSound = this.add.audio('checkSound');
            this.flopSound = this.add.audio('flopSound');
            this.foldSound = this.add.audio('foldSound');
            this.betSound = this.add.audio('betSound');
            this.myTurnSound = this.add.audio('myTurnSound');
            this.moveChipsSound = this.add.audio('moveChipsSound');

            this.dealer = this.add.sprite(this.game.world.centerX+PlayerMap['player0'].dealer[0], this.game.world.centerY+PlayerMap['player0'].dealer[1], 'd');
            this.dealer.anchor.set(0.5);
            // for (var item in PlayerMap)
            // {
            //     var d = this.add.sprite(this.game.world.centerX+PlayerMap[item].dealer[0], this.game.world.centerY+PlayerMap[item].dealer[1], 'd');
            //     d.anchor.set(0.5);
            // }
            $('.ActionFrame').fadeIn(250);
            $(".nano").nanoScroller();

            var game = new Game(this);
        }
    };
    return Holdem;
});
