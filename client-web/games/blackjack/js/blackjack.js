// if (!CanvasRenderingContext2D.myRoundRect)
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

define(function() {
//(function(){
    var winStr = 'Win';
    var loseStr = 'Losse';
    var pushStr = 'Push';
    var youWinStr = 'You win';
    var youLoseStr = 'You lose';
    var joinGameStr = 'Please join the game';
    var endGameStr = 'Please end the game';

    var Client;
    var PlayerMap = {
        dealer: {
            card: [-28, -177],
            text: [495, 50 + 62],
            score: [-55, -130],
            wager: [465, 50 - 15],
            status: [-28, -156]
        },
        player1: {
            card: [222, 10],
            name: [222, 77],
            score: [195, 56],
            wager: [195, 10],
            chip: [195, 26],
            payout: [165, 10],
            status: [222, 31]
        },
        player2: {
            card: [-28, 64],
            name: [-28, 131],
            score: [-55, 110],
            wager: [-55, 64],
            chip: [-55, 80],
            payout: [-85, 64],
            status: [-28, 85]
        },
        player3: {
            card: [-283, 10],
            name: [-283, 77],
            score: [-310, 56],
            wager: [-310, 10],
            chip: [-310, 26],
            payout: [-340, 10],
            status: [-283, 31]
        }
    };
    var WagerMap = [[-201, 164, 1], [-176, 186, 10], [-145, 166, 100], [-117, 188, 1000], [-81, 175, 10000]];
    var ActionMap = {
        Join: [-29, 149],
        Deal: [-29, 149],
        Stand: [-29, 149],
        Hit: [26, 149],
        DoubleDown: [81, 149],
        Surrender: [136, 149]
    };
    var ShoeMap = [396, -184];

    var InitCards = function (game) {
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
    var GetWagerIndex = function (amount) {
        for (var i = 0; i < WagerMap.length; i++) {
            if (WagerMap[i][2] == amount)
                return i;
        }
    };
    var GetChipIndexList = function (amount) {
        var chips = [];
        while (amount >= 1) {
            if (amount >= 10000) {
                amount -= 10000;
                chips.push(4);
            }
            if (amount >= 1000) {
                amount -= 1000;
                chips.push(3);
            }
            if (amount >= 100) {
                amount -= 100;
                chips.push(2);
            }
            else if (amount >= 10) {
                amount -= 10;
                chips.push(1);
            }
            else if (amount >= 1) {
                amount -= 1;
                chips.push(0);
            }
            //else
            //  amount = 0
        }
        return chips;
    };
    var getScore = function (hands) {
        var hard = 0;
        var soft = 0;
        for (var i = 0; i < hands.length; i++) {
            var c = hands[i].key;
            var card;
            try {
                card = c.split(',')[1];
            } catch (e) {
                console.log(c);
            }

            if (card) {
                if (card == 'a' && hard <= 10) {
                    hard += 11;
                    soft += 1;
                } else if (card == 'a' && hard > 10) {
                    hard += 1;
                    soft += 1;
                }
                else if (card == '2') {
                    hard += 2;
                    soft += 2;
                }
                else if (card == '3') {
                    hard += 3;
                    soft += 3;
                }
                else if (card == '4') {
                    hard += 4;
                    soft += 4;
                }
                else if (card == '5') {
                    hard += 5;
                    soft += 5;
                }
                else if (card == '6') {
                    hard += 6;
                    soft += 6;
                }
                else if (card == '7') {
                    hard += 7;
                    soft += 7;
                }
                else if (card == '8') {
                    hard += 8;
                    soft += 8;
                }
                else if (card == '9') {
                    hard += 9;
                    soft += 9;
                }
                else if (card == '10' || card == 'j' || card == 'q' || card == 'k') {
                    hard += 10;
                    soft += 10;
                }
            }
        }
        var ht = hard;
        if (hard > 0) {
            if (soft && hard != soft) {
                if (hard != 21) {
                    if (hard <= 21) {
                        ht = soft + '/' + hard
                    } else {
                        ht = soft
                    }
                }
            }
        }
        return ht;
    };
    var BlackJack = {};
    var Player = function (parent, game, seat, username) {
        this.game = game;
        this.name = username;
        this.seat = seat;
        this.parent = parent;
        this.hands = [];
        this.wagers = [];

        this.SetName(username, seat, "RGBA(0, 0, 0, 0.5)");
    };
    Player.prototype.SetName = function (name, seat, color) {
        if (this.nameText) {
            this.nameText.destroy();
            this.nameText = null;
        }
        var style = {font: "10px Arial", fill: "#fff", align: "center"};
        var pos = PlayerMap[seat].name;
        if (!pos) return;

        var text = this.game.add.text(0, 0, name, style);
        text.x = 10 / 2;
        var bitmap = this.game.add.bitmapData(text.width + 10, 15);
        bitmap.context.strokeStyle = "#3c3c3c";
        //if (this.parent.seat == this.seat)
        //    bitmap.context.fillStyle="RGBA(100, 255, 100, 0.5)";
        //else
        bitmap.context.fillStyle = color;
        bitmap.context.myRoundRect(0, 0, text.width + 10, 15, 5, true);

        this.nameText = this.game.add.sprite(0, this.game.world.centerY + pos[1], bitmap);
        this.nameText.x = this.game.world.centerX + pos[0] + Math.floor((this.nameText.width) * 0.5);
        this.nameText.addChild(text);
    };
    Player.prototype.SetMySelf = function () {
        this.SetName(this.name, this.seat, "RGBA(100, 255, 100, 0.5)");
    };
    Player.prototype.Destroy = function () {
        this.Discard();
        this.RefundChips();
        this.nameText && this.nameText.destroy();
        this.statusText && this.statusText.destroy();
        this.chipsText && this.chipsText.destroy();
        this.scoreText && this.scoreText.destroy();
        this.nameText = this.statusText = this.chipsText = this.scoreText = null;
    };
    Player.prototype.SetStatus = function (text) {
        if (text == 'Bust' && !this.game.game.isStopSound) this.game.audio_bust.play();
        else if (text == 'Blackjack' && !this.game.game.isStopSound) this.game.audio_blackjack.play();

        this.RemoveStatus();
        var style = {font: "bold 15px Arial", fill: "#990033", stroke: "#fff", strokeThickness: 5, align: "center"};
        this.statusText = this.game.add.text(0, 0, text, style);
        var w = 45 + (this.hands.length - 1) * (45 - 20);
        this.statusText.x = this.game.world.centerX + PlayerMap[this.seat].status[0] + Math.floor((w - this.statusText.width) * 0.5);
        this.statusText.y = this.game.world.centerY + PlayerMap[this.seat].status[1];
    };
    Player.prototype.RemoveStatus = function () {
        this.statusText && this.statusText.destroy();
        this.statusText = null;
    };
    Player.prototype.Bet = function (index) {
        var self = this;
        var sprite = this.AddChip(WagerMap[index], index);
        sprite.scale.set(0.5);
        sprite.value = WagerMap[index][2];
        var pos = PlayerMap[this.seat].wager;
        var tween = this.game.add.tween(sprite).to({
            x: this.game.world.centerX + pos[0],
            y: this.game.world.centerY + pos[1] - this.wagers.length * 3
        }, 700, Phaser.Easing.Linear.None, true);
        this.game.add.tween(sprite.scale).to({x: 0.3, y: 0.3}, 700, Phaser.Easing.Linear.None, true);
        this.wagers.push(sprite);
        //移到位置后在填加事件
        tween.onComplete.add(function () {
            sprite.events.onInputDown.add(function () {
                self.parent.socket.emit('cancelBet', null);
                self.RefundChips();
            }, self.game);
            self.TotalChips();
        }, self.game);

        this.TotalChips();
    };
    Player.prototype.AddChip = function (pos, index) {
        var wager = this.game.add.sprite(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], 'wager', index);
        wager.inputEnabled = true;
        return wager;
    };
    //退回筹码
    Player.prototype.RefundChips = function () {
        var sprite, tween;
        for (var i = 0; i < this.wagers.length; i++) {
            sprite = this.wagers[i];
            tween = this.game.add.tween(sprite).to({y: 536}, 700, Phaser.Easing.Linear.None, true);
            (function (sprite, tween) {
                tween.onComplete.add(function () {
                    sprite.destroy();
                }, this);
            })(sprite, tween);
        }
        this.wagers = [];
        if (this.chipsText) {
            this.chipsText.destroy();
            this.chipsText = null;
        }
    };
    //统计筹码数量
    Player.prototype.TotalChips = function () {
        var amount = 0;
        for (var i = 0; i < this.wagers.length; i++) {
            amount += this.wagers[i].value;
        }
        var shortName = '';
        if (this.coin == 'BitCoin') {
            shortName = 'mBtc';
            //amount *= 1000;
        }
        else if (this.coin == 'LiteCoin') {
            shortName = 'mLTC';
            //amount *= 1000;
        }
        else
            shortName = share.coinToShortName(this.coin);
        if (this.chipsText)
            this.chipsText.setText(amount + ' ' + shortName);
        else {
            var style = {font: "12px Arial", fill: "#fff", align: "center"};
            this.chipsText = this.game.add.text(0, 0, amount + ' ' + shortName, style);
        }
        var pos = PlayerMap[this.seat].chip;
        this.chipsText.x = this.game.world.centerX + pos[0] - this.chipsText.width;
        this.chipsText.y = this.game.world.centerY + pos[1];
    };
    //显示筹码列表
    Player.prototype.ShowChipList = function (coin, betList) {
        var amount = 0, sprite, index, bet;
        for (var a = 0; a < betList.length; a++) {
            bet = betList[a];
            if (coin == 'BitCoin' || coin == 'LiteCoin')
                bet = bet * 1000;
            index = GetWagerIndex(bet);
            sprite = this.AddChip(PlayerMap[this.seat].wager, index);
            sprite.y -= this.wagers.length * 3;
            sprite.scale.set(0.3);
            sprite.value = bet;
            this.wagers.push(sprite);
            amount += bet;
        }
        this.TotalChips();
    };
    Player.prototype.SetScore = function () {
        var score = getScore(this.hands);
        if (this.scoreText)
            this.scoreText.setText(score);
        else {
            var pos = PlayerMap[this.seat].score;
            var style = {font: "10px Arial", fill: "#fff", align: "center"};
            this.scoreText = this.game.add.text(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], score, style);
        }
    };
    Player.prototype.ShowCardList = function (cardList) {
        for (var i = 0; i < cardList.length; i++) {
            this.AddCard(cardList[i]);
        }
        this.SetScore();
    };
    Player.prototype.AddCard = function (card) {
        if (card == ',') {
            card = 'CardBack';
        }
        var pos = PlayerMap[this.seat].card;
        var sprite = this.game.add.sprite(this.game.world.centerX + pos[0] + this.hands.length * 20, this.game.world.centerY + pos[1], card);
        sprite.scale.set(0.75);
        this.hands.push(sprite);
    };
    Player.prototype.Hit = function (card) {
        var self = this;
        var sprite = this.game.add.sprite(this.game.world.centerX + ShoeMap[0], this.game.world.centerY + ShoeMap[1], 'CardBack');
        sprite.angle = -85;
        var pos = PlayerMap[this.seat].card;
        var tween = this.game.add.tween(sprite).to({
            x: self.game.world.centerX + pos[0] + self.hands.length * 20,
            y: self.game.world.centerY + pos[1],
            angle: 0
        }, 700, Phaser.Easing.Linear.None, true);
        this.game.add.tween(sprite.scale).to({x: 0.75, y: 0.75}, 700, Phaser.Easing.Linear.None, true);
        this.hands.push(sprite);
        tween.onComplete.add(function () {
            //sprite.flipX = true;
            if (card != ',')
                sprite.loadTexture(card, '');
            self.SetScore();
        }, this);
        if (!this.game.game.isStopSound)
            self.game.audio_deal.play();
    };
    Player.prototype.DoFlip = function (card) {
        var sprite = this.hands[this.hands.length - 1];
        sprite.loadTexture(card, '');
        this.SetScore();
    };
    Player.prototype.Payout = function (wager, mult, amount) {
        var self = this;
        var chips = GetChipIndexList(amount);
        var pos = PlayerMap[this.seat].payout;
        var sprite, tween, chipList = [];
        if (mult != 0)
        {
            for (var i = 0; i < chips.length; i++) {
                sprite = this.AddChip([-20, -245], chips[i]);
                sprite.y -= this.wagers.length * 3;
                sprite.scale.set(0.5);
                tween = this.game.add.tween(sprite).to({
                    x: this.game.world.centerX + pos[0],
                    y: this.game.world.centerY + pos[1] - chipList.length * 3,
                    angle: 0
                }, 700, Phaser.Easing.Linear.None, true);
                this.game.add.tween(sprite.scale).to({x: 0.3, y: 0.3}, 700, Phaser.Easing.Linear.None, true);
                chipList.push(sprite);
            }
        }

        setTimeout(function () {
            var h = 0;
            if (mult < 0 || mult == -0.5)
                h = -700;
            else
                h = 700;

            //if (winChip > 0)
            //    h = 700;
            //else
            //    h = -700;
            for (var i = 0; i < self.wagers.length; i++) {
                sprite = self.wagers[i];
                tween = self.game.add.tween(sprite).to({
                    y: self.game.world.centerY + h,
                    angle: 0
                }, 700, Phaser.Easing.Linear.None, true);
                (function (sprite, tween) {
                    tween.onComplete.add(function () {
                        sprite.destroy();
                    }, self);
                })(sprite, tween);
            }
            if (self.chipsText) {
                self.chipsText.destroy();
                self.chipsText = null;
            }
            self.wagers = [];
        }, 750);
        if (chips.length > 0) {
            setTimeout(function () {
                for (var i = 0; i < chipList.length; i++) {
                    sprite = chipList[i];
                    tween = self.game.add.tween(sprite).to({
                        y: self.game.world.centerY + 700,
                        angle: 0
                    }, 700, Phaser.Easing.Linear.None, true);
                    (function (sprite, tween) {
                        tween.onComplete.add(function () {
                            sprite.destroy();
                        }, self);
                    })(sprite, tween);
                }
            }, 850);
        }
    };
    Player.prototype.Discard = function () {
        var sprite, tween;
        for (var i = 0; i < this.hands.length; i++) {
            sprite = this.hands[i];
            tween = this.game.add.tween(sprite).to({
                x: this.game.world.centerX - 383,
                y: this.game.world.centerY - 230
            }, 700, Phaser.Easing.Linear.None, true);
            (function (tween, sprite) {
                tween.onComplete.add(function () {
                    sprite.destroy();
                });
            })(tween, sprite);
        }
        this.hands = [];
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }
        if (this.statusText) {
            this.statusText.destroy();
            this.statusText = null;
        }
    };

    var Game = function (game) {
        this.game = game;
        this.PlayerObjs = {};
        this.wagerList = [];
        this.socket = game.game.socket;
        this.domain = document.domain;
        this.port = 9000;
        this.roomId = 1;
        this.seat = '';  //当前用户坐位
        this.hands = {
            'dealer': [],
            'player1': [],
            'player2': [],
            'player3': []
        };
        this.wagers = {
            'player1': [],
            'player2': [],
            'player3': []
        };
        //this.Tools();
        this.Client();
        $('.coinBtn').click(function () {
            if ($(this).hasClass("open")) {
                $(this).removeClass("open").addClass("close");
                $(".coinList li").removeClass("open").addClass("close");
            } else {
                $(this).removeClass("close").addClass("open");
                $(".coinList li").removeClass("close").addClass("open");
            }
        });
        var self = this;
        $('.coinList li img').click(function () {
            self.coin = $(this).attr('data');
            $.cookie('coin', self.coin, {path: "/"});
            self.socket.emit('coin', self.coin);
            $('.coinBtn img').attr('src', '/public/images/coin/' + share.coinToShortName(self.coin).toLowerCase() + '.png');
        })
    };
    Game.prototype.StartCountDown = function (n) {
        this.StopCountDown();
        var style = {font: "50px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center"};
        this.timerText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, n + '', style);
        this.timerText.anchor.set(0.5);
        this.timerText.scale.set(0.5);
        //this.game.physics.enable(this.timerText, Phaser.Physics.ARCADE);
        //this.game.add.tween(this.timerText.scale).to( { x: 1, y: 1 }, 700, Phaser.Easing.Linear.None, true, 0, 1000, true);

        var self = this;
        n--;
        this.timer = setInterval(function () {
            self.timerText.setText(n);
            if (n <= 0) self.StopCountDown();
            n--;
        }, 1000);
    };
    Game.prototype.StopCountDown = function () {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.timerText) {
            this.timerText.destroy();
            this.timerText = null;
        }
    };
    Game.prototype.DestroyAction = function (btn) {
        if (btn) {
            btn.destroy();
        }
    };
    Game.prototype.Tools = function () {
        var self = this;
        var homeSprite = this.game.add.sprite(this.game.world.centerX + 300, this.game.world.centerY - 290, 'tools', 0);
        this.ToolEvent(homeSprite, function () {
            self.socket.emit('getRoomList', null);
        });
        var logoutSprite = this.game.add.sprite(this.game.world.centerX + 350, this.game.world.centerY - 290, 'tools', 1);
        this.ToolEvent(logoutSprite, function () {
            self.socket.emit('exit', null);
        });
        var screenSprite = this.game.add.sprite(this.game.world.centerX + 400, this.game.world.centerY - 290, 'tools', 2);
        this.ToolEvent(screenSprite, function () {
        });
    };
    Game.prototype.ToolEvent = function (sprite, callback) {
        sprite.inputEnabled = true;
        sprite.events.onInputDown.add(function (game) {
            callback();
        }, this.game);
        sprite.events.onInputOver.add(function (game) {
            sprite.scale.set(1.1);
        }, this.game);
        sprite.events.onInputOut.add(function (game) {
            sprite.scale.set(1);
        }, this.game);
    };
    Game.prototype.Message = function (text, timeout) {
        var style = {font: "bold 50px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center"};
        var t = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 30, text, style);
        t.anchor.set(0.5);
        t.scale.set(0.5);
        var tween = this.game.add.tween(t.scale).to({x: 1, y: 1}, 700, Phaser.Easing.Linear.None, true);
        tween.onComplete.add(function () {
            setTimeout(function () {
                t.destroy();
            }, timeout * 1000);
        });
    };
    Game.prototype.SetBalance = function (balance) {
        var shortName = '';
        if (this.coin == 'BitCoin') {
            shortName = 'mBtc';
            balance *= 1000;
        }
        else if (this.coin == 'LiteCoin') {
            shortName = 'mLTC';
            balance *= 1000;
        }
        else
            shortName = share.coinToShortName(this.coin);
        this.balance = balance.toFloat();
        if (this.balanceText) {
            this.balanceText.setText(this.balance + ' ' + shortName);
            this.balanceText.x = this.game.world.centerX - 370 - this.balanceText.width / 2;
        }
        else {
            var style = {font: "30px Arial", fill: "#fff", align: "center"};
            this.balanceText = this.game.add.text(0, this.game.world.centerY + 171, this.balance + ' ' + shortName, style);
            this.balanceText.x = this.game.world.centerX - 370 - this.balanceText.width / 2;
            this.balanceText.setShadow(2, 3, 'rgba(0, 0, 0, 0.5)', 0);
        }
        this.UpdateChip();
    };
    Game.prototype.ClearChip = function () {
        for (var i = 0; i < this.wagerList.length; i++)
            this.wagerList[i].destroy();
    };
    Game.prototype.UpdateChip = function (isShow) {
        if (!this.seat) return;
        var self = this;
        this.ClearChip();
        this.wagerList = [];
        var balance = this.balance;
        var wagerValueList = {};
        //筹码显示方案
        var n = 4;
        for (var i = 0; i < 5; i++) {
            wagerValueList[n] = 10000 / Math.pow(10, i);
            n--;
        }
        var wager, style, t;
        for (var i = 0; i < WagerMap.length; i++) {
            wager = this.game.add.sprite(this.game.world.centerX + WagerMap[i][0], this.game.world.centerY + WagerMap[i][1], 'wager', i);
            wager.inputEnabled = true;
            wager.scale.set(0.5);
            style = {
                font: "bold 24px Arial",
                fill: "#fff",
                wordWrap: true,
                wordWrapWidth: wager.width,
                align: "center"
            };
            t = this.game.add.text(0, 10, wagerValueList[i], style);
            t.x = Math.floor((wager.width - t.width) * 0.5) + 20;
            wager.addChild(t);
            if (isShow) {
                wager.alpha = 0.5;
            }
            else if (balance < wagerValueList[i]) {
                wager.alpha = 0.5;
                balance -= wagerValueList[i];
            }
            else {
                (function (wager, i) {
                    wager.events.onInputDown.add(function (game) {
                        var value = 0;
                        if (self.coin == 'BitCoin' || self.coin == 'LiteCoin')
                            value = wagerValueList[i] / 1000;
                        else
                            value = wagerValueList[i];
                        self.socket.emit('bet', [self.coin, value]);
                    }, self.game);
                })(wager, i);
            }
            this.wagerList.push(wager);
        }
    };
    Game.prototype.ShowMinMaxChip = function (min, max) {
        if (this.coin == 'BitCoin') {
            max *= 1000;
        }
        else if (this.coin == 'LiteCoin') {
            max *= 1000;
        }
        var minStr = 'Min 1';
        var maxStr = 'Max ' + parseInt(max);
        var style = {font: "16px Arial", fill: "#FFCC00", align: "left"};
        if (this.minText)
            this.minText.setText(minStr);
        else {
            this.minText = this.game.add.text(this.game.world.centerX + 228, this.game.world.centerY - 245, minStr, style);
            //this.minText.anchor.set(0.5);
            this.minText.angle = 4;
        }
        if (this.maxText)
            this.maxText.setText(maxStr);
        else {
            this.maxText = this.game.add.text(this.game.world.centerX + 228, this.game.world.centerY - 222, maxStr, style);
            //this.maxText.anchor.set(0.5);
            this.maxText.angle = 4;
        }
    };

    Game.prototype.AddAction = function (pos, index, text, action) {
        var button = this.game.add.button(this.game.world.centerX + pos[0], this.game.world.centerY + pos[1], 'action', action, this.game, index + 1, index);
        button.scale.set(0.7);
        var style = {font: "18px Arial", fill: "#fff", wordWrap: true, wordWrapWidth: button.width, align: "center"};
        var t = this.game.add.text(0, 70, text, style);
        button.addChild(t);
        t.x = Math.floor((button.width - t.width) * 0.5) + 15;
        return button;
    };
    Game.prototype.ClearPlayer = function () {
        for (var item in this.PlayerObjs) {
            var player = this.PlayerObjs[item];
            player.Destroy();
            //player.ClearChip();
        }
        this.PlayerObjs = [];
    };
    Game.prototype.ClearAction = function () {
        this.DestroyAction(this.joinAction);
        this.DestroyAction(this.dealAction);
        this.DestroyAction(this.standAction);
        this.DestroyAction(this.hitAction);
        this.DestroyAction(this.doubleDownAction);
        this.DestroyAction(this.surrenderAction);
    };
    Game.prototype.ClearOrther = function () {
        this.balanceText && this.balanceText.destroy();
        this.balanceText = null;
    };
    Game.prototype.UpdateAction = function (seat, type) {
        var self = this;
        this.ClearAction();
        if (type == 0) {
            this.UpdateChip(true);
            this.joinAction = this.AddAction(ActionMap['Join'], 0, 'Join', function () {
                self.socket.emit('join', null);
                self.ClearAction();
            });
        }
        else if (type == 1) {
            this.UpdateChip(false);
            this.dealAction = this.AddAction(ActionMap['Deal'], 2, 'Deal', function () {
                self.socket.emit('deal', null);
                self.ClearAction();
            });
        }
        else if (type == 2) {
            this.UpdateChip(true);
            this.standAction = this.AddAction(ActionMap['Stand'], 4, 'Stand', function () {
                self.socket.emit('stand', null);
                self.ClearAction();
            });
            this.hitAction = this.AddAction(ActionMap['Hit'], 6, 'Hit', function () {
                self.socket.emit('hit', null);
                self.ClearAction();
            });
            this.doubleDownAction = this.AddAction(ActionMap['DoubleDown'], 8, 'Double\nDown', function (button) {
                if (button.alpha == 0.5) return;
                self.socket.emit('doubledown', null);
                self.ClearAction();
            });
            if (seat && (this.PlayerObjs[seat].wagers.length == 0 || this.PlayerObjs[seat].hands.length > 2)) {
                this.doubleDownAction.alpha = 0.5;
            }
            this.surrenderAction = this.AddAction(ActionMap['Surrender'], 10, 'Surrender', function () {
                self.socket.emit('surrender', null);
                self.ClearAction();
            });
        }
    };
    Game.prototype.connectStatus = function(text){
        this.connectStatusText && this.connectStatusText.destroy();
        var style = {font: "20px Arial", fill: "#fff", stroke: "#333", strokeThickness: 2, align: "center"};
        this.connectStatusText = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 20, text, style);
        this.connectStatusText.anchor.set(0.5);
    };
    Game.prototype.Client = function () {
        var self = this;
        this.socket.connect(BlackJackServer);
        this.socket.on('connect', function (data) {
            if (self.connectStatusText){
                self.connectStatusText.destroy();
                self.connectStatusText = undefined;
            }
            var roomId = $.cookie('blackjack_room') || 1;
            self.coin = $.cookie('coin') || 'DogeCoin';
            $('.coinBtn img').attr('src', '/public/images/coin/' + share.coinToShortName(self.coin).toLowerCase() + '.png');
            setTimeout(function () {
                self.socket.emit('init', {roomId: roomId, coin: self.coin})
            }, 300);
        });
        this.socket.on('connect_error', function () {
            self.connectStatus('connecting...');
        });
        this.socket.on('disconnect', function () {
            self.connectStatus('connecting...');
        });
        this.socket.on('error', function () {
        });
        this.socket.on('msg', function (data) {
            self.Message(data.msg, 3);
        });
        this.socket.on('init', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'init', data);
            self.ClearOrther();
            self.ClearPlayer();
            self.ClearAction();
            self.ClearChip();

            var status, username, cardList, betList, player;
            var playerList = data.players;
            for (var item in playerList) {
                username = playerList[item]['username'];
                player = new Player(self, self.game, item, username);
                self.PlayerObjs[item] = player;
                player.coin = playerList[item].coin;
                cardList = playerList[item]['cardList'];
                player.ShowCardList(cardList);
                status = playerList[item]['status'];
                if (status)
                    player.SetStatus(status);
                betList = playerList[item]['betList'] || [];
                if (betList.length > 0) player.ShowChipList(playerList[item].coin, betList);
            }
            if (!self.PlayerObjs['dealer'])
                self.PlayerObjs['dealer'] = new Player(self, self.game, 'dealer', 'dealer');
        });
        this.socket.on('my', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'my', data);
            var username = data.username;
            self.seat = data.seat;
            self.coin = data.coin;
            if (data.seat)// && !data.status
            {
                $('.tools .exit').fadeIn(250);
                var player = self.PlayerObjs[self.seat];
                if (!player)
                    self.PlayerObjs[self.seat] = player = new Player(self, self.game, self.seat, username);
                player.SetMySelf();
                if (data['playing']) {
                    if (data['dealing'])
                        self.UpdateAction(self.seat, 2);
                    else
                        self.UpdateAction(self.seat, 1);
                }
                else
                    self.UpdateAction(self.seat, 0);
                self.SetBalance(data.balance);
            }
            else {
                self.UpdateAction(self.seat, 0);
            }
            self.ShowMinMaxChip(0.1, data.maxBet);
        });
        this.socket.on('join', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'join', data);
            if (!self.PlayerObjs['dealer'])
                self.PlayerObjs['dealer'] = new Player(self, self.game, 'dealer', 'dealer');
            var username = data.username;
            var player = self.PlayerObjs[data.seat];
            if (!player) {
                player = new Player(self, self.game, data.seat, username);
                self.PlayerObjs[data.seat] = player;
            }
            //player.SetStatus(data.status);
        });
        this.socket.on('deal', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'deal', data);
            var seat, card, time = 0;
            for (var i = 0; i < data.length; i++) {
                seat = data[i][0];
                card = data[i][1];
                (function (seat, card, time) {
                    setTimeout(function () {
                        var player = self.PlayerObjs[seat];
                        if (!player) return;
                        player.Hit(card);
                    }, time);
                })(seat, card, time);
                time += 700;
            }
            if (self.seat) {
                self.UpdateAction(self.seat, 2);
            }
            self.StartCountDown(20);
        });
        this.socket.on('bet', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'bet', data);
            var seat = data.seat;
            var username = data.username;
            var maxBet = data.maxBet;
            var coin = data.coin;
            var bet = data.bet;
            if (coin == 'BitCoin' || coin == 'LiteCoin')
                bet = bet * 1000;
            var index = GetWagerIndex(bet);
            var player = self.PlayerObjs[seat];
            if (!player) return;
            player.coin = coin;
            player.Bet(index);
            self.ShowMinMaxChip(0.1, data.maxBet);
        });
        this.socket.on('hit', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'hit', data);
            var seat = data[0];
            var card = data[1];
            var player = self.PlayerObjs[seat];
            if (!player) return;
            player.Hit(card);
            if (seat == self.seat) {
                self.UpdateAction(self.seat, 2);
            }
        });
        this.socket.on('doflip', function (data) {
            if (!data) return;
            console.log(share.toTimeStr(share.getNowTime()), 'doflip', data);
            var player = self.PlayerObjs['dealer'];
            var n = player.hands.length;
            if (n < 2) return;
            player.DoFlip(data);
        });
        this.socket.on('payout', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'payout', data);
            var seat = data[0];
            var coin = data[1];
            var mult = data[2];
            var wager = data[3];
            var player = self.PlayerObjs[seat];
            if (!player) return;
            var winCash = wager * mult;
            if (coin == 'BitCoin' || coin == 'LiteCoin')
                winCash = winCash * 1000;
            player.Payout(wager, mult, winCash);

            if (seat == self.seat) {
                if (winCash > 0)
                    self.Message(winStr + ' ' + Math.abs(winCash) + ' ' + share.coinToShortName(coin), 2);
                //else if (winCash < 0)
                //    self.Message(loseStr+' '+Math.abs(winCash), 2);
                else if (winCash == 0 && mult == 0)
                    self.Message(pushStr, 2);
                else if (winCash == 0 && mult > 0)
                    self.Message(winStr, 2);
                //else if (winCash == 0 && mult < 0)
                //    self.Message(youLoseStr, 2);
                self.StopCountDown();
                if (mult > 0 && !self.game.game.isStopSound)
                    self.game.audio_win.play();
            }
        });
        this.socket.on('balance', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'balance', data);
            var seat = data[0];
            var balance = data[1];
            self.SetBalance(balance);
        });
        this.socket.on('gameover', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'gameover', data);
            for (var item in self.PlayerObjs)
                self.PlayerObjs[item].Discard();
            self.StopCountDown();
            if (!self.seat) {
                return;
            }
            setTimeout(function () {
                self.UpdateAction(self.seat, 1);
            }, 1500);
        });
        this.socket.on('cancleBet', function (data) {
            var player = self.PlayerObjs[data];
            player.RefundChips();
        });
        this.socket.on('status', function (data) {
            console.log(share.toTimeStr(share.getNowTime()), 'status', data);
            var seat = data.seat;
            var status = data.status;
            //防止由于延迟显示造成的状态为设置成功
            var player = self.PlayerObjs[seat];
            if (!player) return;
            if (status == 'Stand')
                player.SetStatus(status);
            else if (status == '') {
                player.RemoveStatus();
            }
            else {
                //等待牌发下来
                setTimeout(function () {
                    player.SetStatus(status);
                }, 700)
            }
            if (seat == self.seat)
                self.ClearAction();
        });
        this.socket.on('countdown', function (data) {
            self.StartCountDown(data);
        });
        this.socket.on('exit', function (seat) {
            console.log(share.toTimeStr(share.getNowTime()), 'exit', seat);
            var player = self.PlayerObjs[seat];
            if (!player) return;
            player.Destroy();
            if (seat == self.seat) {
                self.UpdateAction(seat, 0);
                self.ClearChip();
                self.seat = null;
                $('.tools .exit').fadeOut(250);
            }
            delete self.PlayerObjs[seat];
        });
        //房间列表
        this.socket.on('roomList', function (data) {
            console.log('roomList', data);
            $('.Room .list-group-item:not(:nth-child(1))').remove();
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                $('.Room .list-group-item:first').after('<a class="list-group-item"> <span class="badge">' + item.userCount + '/3</span><span class="roomId">' + item.name + '</span></a>');
            }
            $('.Room').show();
            $('.Room .list-group a').click(function () {
                var roomId = $(this).find('.roomId').text();
                $.cookie('blackjack_room', parseInt(roomId), {path: '/'});
                //location.reload();
                self.socket.emit('init', {roomId: roomId});
                $('.Room').hide();
            })
        });
        this.socket.on('seedInfo', function(data){
            var fairBox = $('.fairBox');
            fairBox.fadeIn(250);
            $('#next_client_seed').val(data.nextClientSeed);
            $('#next_server_hash').val(data.nextServerHash);
            $('#now_client_seed').val(data.nowClientSeed);
            $('#now_server_seed').val(data.nowServerSeed);
            $('#now_server_hash').val(data.nowServerHash);
        });
    };
    //引导 创建界面
    BlackJack.Boot = function (game) {
    };
    BlackJack.Boot.prototype = {
        preload: function () {
            this.load.image('preloaderBar', '/games/blackjack/images/loading-bar.png');
        },
        create: function () {
            this.input.maxPointers = 1;
            this.physics.startSystem(Phaser.Physics.ARCADE);
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.setScreenSize(true);
            this.state.start('Preloader');
        }
    };

    BlackJack.Preloader = function (game) {
        this.GAME_WIDTH = $('#BlackJack').innerWidth();
        this.GAME_HEIGHT = $('#BlackJack').innerHeight();
    };
    BlackJack.Preloader.prototype = {
        preload: function () {
            this.stage.backgroundColor = '#000';
            this.preloadBar = this.add.sprite((this.GAME_WIDTH - 311) / 2, (this.GAME_HEIGHT - 27) / 2, 'preloaderBar');
            this.load.setPreloadSprite(this.preloadBar);
            this.load.image('background', '/games/blackjack/images/table.jpg');
            this.load.spritesheet('wager', '/games/blackjack/images/wager.png', 73, 59);
            this.load.spritesheet('action', '/games/blackjack/images/action.png', 74, 70);
            //this.load.spritesheet('tools', '/games/blackjack/images/tools.png', 32, 32);
            //提前生成牌资源
            InitCards(this);

            this.load.audio('audio_deal2', '/games/blackjack/sound/deal2.mp3');
            this.load.audio('audio_bust', '/games/blackjack/sound/bust.mp3');
            this.load.audio('audio_music', '/games/blackjack/sound/music.mp3');
            this.load.audio('audio_blackjack', '/games/blackjack/sound/blackjack.mp3');
            this.load.audio('audio_win', '/games/blackjack/sound/win.mp3');
        },
        create: function () {
            // start the MainMenu state
            this.state.start('MainMenu');
        }
    };
    BlackJack.MainMenu = function (game) {
    };
    BlackJack.MainMenu.prototype = {
        create: function () {
            this.physics.startSystem(Phaser.Physics.ARCADE);
            // display images
            var background = this.add.sprite(this.world.centerX, this.world.centerY, 'background');
            background.anchor.set(0.5);
            //background.scale.setTo(0.5, 0.5);
            //this.scale.setResizeCallback(this.resize, this);

            this.audio_deal = this.add.audio('audio_deal2');
            this.audio_bust = this.add.audio('audio_bust');
            this.audio_music = this.add.audio('audio_music');
            this.audio_blackjack = this.add.audio('audio_blackjack');
            this.audio_win = this.add.audio('audio_win');

            this.audio_music.play('', 0, 1, true);
            this.game.audio_music = this.audio_music;

            var game = new Game(this);
        },
        resize: function () {

        }
    };
    //window.BlackJack = BlackJack;
    return BlackJack;
//})();
})