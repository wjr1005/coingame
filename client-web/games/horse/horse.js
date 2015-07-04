(function(){
    function objecValues(obj){
        var values = [];
        for(var pro in obj){
            values.push(obj[pro]);
        }
        return values;
    }

    var PLAYGROUND_WIDTH = 2000;
    var horseList = [1,2,3,4,5,6];

    var Game = function(game, socket){
        this.game = game;
        this.socket = socket;
        this.LengData = {};
        $('.horseFrame .select').show();

        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.world.setBounds(0, 0, 2000+210, 0);
        // display images
        this.bg1 = this.game.add.sprite(0, 126, 'bg1');
        this.bg2 = this.game.add.tileSprite(136, 126, 2000-136, 270, 'bg2');
        this.bg3 = this.game.add.tileSprite(0, 0, 2000+210, 126, 'bg3');
        this.bg4 = this.game.add.tileSprite(0, 396, 2000+210, 84, 'bg4');
        this.end1 = this.game.add.sprite(2000, 126, 'end1');
        this.end2 = this.game.add.sprite(2000+40, 126, 'end2');
        this.horse1Sprite = this.game.add.sprite(0, 104, 'horse1', 0);
        this.horse2Sprite = this.game.add.sprite(0, 150, 'horse2', 0);
        this.horse3Sprite = this.game.add.sprite(0, 196, 'horse3', 0);
        this.horse4Sprite = this.game.add.sprite(0, 242, 'horse4', 0);
        this.horse5Sprite = this.game.add.sprite(0, 288, 'horse5', 0);
        this.horse6Sprite = this.game.add.sprite(0, 334, 'horse6', 0);
        this.horse1Sprite.animations.add('run');
        this.horse2Sprite.animations.add('run');
        this.horse3Sprite.animations.add('run');
        this.horse4Sprite.animations.add('run');
        this.horse5Sprite.animations.add('run');
        this.horse6Sprite.animations.add('run');

        this.game.camera.follow(this.horse1Sprite);
        this.InitSocket();

    };
    Game.prototype.Message = function(text, timeout){
        var style = { font: "bold 80px Arial", fill: "#FFCC00", stroke: "#333", strokeThickness: 5, align: "center" };
        var t = this.game.add.text(this.game.world.centerX, this.game.world.centerY, text, style);
        t.anchor.set(0.5);
        t.scale.set(0.5);
        t.x = this.game.world.centerX + Math.floor((t.width)*0.5);
        t.y = this.game.world.centerY;
        var tween = this.game.add.tween(t.scale).to({x: 1, y:1}, 700, Phaser.Easing.Linear.None, true);
        tween.onComplete.add(function(){
            setTimeout(function(){
                t.destroy();
            }, timeout*1000);
        });
    };
    Game.prototype.Start = function(){
        $('.horseFrame .select').hide();
        this.socket.emit('start', null);
        //this.Run();
    };
    Game.prototype.Run = function(horseData){
        this.horse1Sprite.animations.play('run', 3, true);
        this.horse2Sprite.animations.play('run', 3, true);
        this.horse3Sprite.animations.play('run', 3, true);
        this.horse4Sprite.animations.play('run', 3, true);
        this.horse5Sprite.animations.play('run', 3, true);
        this.horse6Sprite.animations.play('run', 3, true);
        //var horseData = this.CreateHorseData();
        //console.log(horseData);
        var lengthData = {};
        var self = this;
        var n = 0;
        self.runTimer = setInterval(function(){
            self.Loop(n, lengthData, horseData);
            n++;
        }, 60);
    };
    Game.prototype.CreateHorseData = function(){
        var dataDict = {};
        var lengthDict = {};
        var random, maxLeng;
        while (1)
        {
            for (var i = 1; i <=6; i++)
            {
                if (!dataDict[i]) dataDict[i] = [];
                if (!lengthDict[i]) lengthDict[i] = 0;
                random = Math.floor(Math.random()*20+1);
                dataDict[i].push(random);
                lengthDict[i] += random;
            }
            //当有一匹马 头碰到线时 结束
            maxLeng = Math.max.apply(null, share.objecValues(lengthDict));
            if (maxLeng >= PLAYGROUND_WIDTH)
                break;
        }
        return dataDict;
    };
    Game.prototype.Payout = function(winHorse){
        if (this.myResult.winHorse == winHorse){
            this.Message(winHorse+'号赢\n获胜奖金 '+this.myResult.wager, 3);
        }
        else
            this.Message('Failure', 3);
    };
    Game.prototype.Loop = function (n, lengthData, horseData, horseDataBak) {
        var self = this;
        var minLeng = Math.min.apply(null, objecValues(lengthData));
        if (minLeng != Infinity && minLeng >= PLAYGROUND_WIDTH + 210)
        {
            clearInterval(this.runTimer);
            var winHorse = 0;
            var maxLeng = Math.max.apply(null, objecValues(lengthData));
            for (var h = 1; h <= 6; h++)
            {
                if (maxLeng == lengthData[h])
                {
                    winHorse = h;
                    break;
                }
            }
            this.Payout(winHorse);
            setTimeout(function(){
                self.horse1Sprite.x = 0;
                self.horse2Sprite.x = 0;
                self.horse3Sprite.x = 0;
                self.horse4Sprite.x = 0;
                self.horse5Sprite.x = 0;
                self.horse6Sprite.x = 0;
                self.horse1Sprite.animations.stop(null, true);
                self.horse2Sprite.animations.stop(null, true);
                self.horse3Sprite.animations.stop(null, true);
                self.horse4Sprite.animations.stop(null, true);
                self.horse5Sprite.animations.stop(null, true);
                self.horse6Sprite.animations.stop(null, true);
                $('.horseFrame .select').show();
            }, 4000);
        }
        else
        {
            for (var h = 1; h <= 6; h++)
            {
                var r = horseData[h][n];
                if (!r){
                    r = 10;
                }
                eval('this.horse'+h+'Sprite.x += '+r+';');
                if (!lengthData[h]) lengthData[h] = 0;
                lengthData[h] += r;
            }
        }
    };
    Game.prototype.initSelect = function(data){
        $('.horseFrame .select').show();
        var html = '', item;
        for (var i = 0; i < data.length; i++)
        {
            item = data[i];
            html += '<tr>\
            <td style="width: 75px; text-align: center">'+item.id+'</td>\
            <td style="width: 135px; padding-left:7px;">'+item.name+'</td><td style="width: 75px; text-align:center;">3</td>\
            <td style="width: 130px; text-align:center;">'+item.winRate+'%</td>\
            <td style="width: 65px; text-align:center;">'+item.odds+'</td>\
            <td style="width: 140px; text-align:center;">\
            <div class="form-inline" ng-show="!item.wager && !wager1">\
            <div class="form-group">\
            <input type="text" class="form-control input-sm" style="width: 89px;" ng-model="input1">\
            </div>\
            <button class="btn btn-primary btn-sm" ng-click="bet1()">下注</button>\
            </div>\
            <div ng-show="item.wager || wager1">{{item.wager || wager1}}</div>\
            </td>\
            </tr>';
        }

        $('.horseFrame .select table').prepend();
    };
    Game.prototype.InitSocket = function(){
        var self = this;
        self.socket.connect(document.domain, 9002);
        self.socket.on('connect', function(data){
            self.socket.emit('init', $.cookie('coin'));
            //showFloatMsg('success', connectSuccess);
        });
        self.socket.on('error', function(){
            //showFloatMsg('warning', connectError);
        });
        self.socket.on('disconnect', function(data){
            //showFloatMsg('warning', disconnected);
        });
        self.socket.on('init', function(data){
            console.log('init', data);
            self.initSelect(data);
        });
        self.socket.on('my', function(data){
            console.log('my', data);
        });
        self.socket.on('restore', function(data){
            console.log('restore', data);
        });
        self.socket.on('number', function(data){
            console.log('number', data);
        });
        self.socket.on('start', function(data){
            console.log('start', data);
            self.Run(data);
        });
        self.socket.on('payout', function(data){
            console.log('payout', data);
            self.myResult = data;
        });
        self.socket.on('msg', function(data){
            console.log('msg', data);
            //Message(data, 3);
        });
    };

    var Horse = {};
    //引导 创建界面
    Horse.Boot = function(game){};
    Horse.Boot.prototype = {
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

    Horse.Preloader = function(game){
        Horse.GAME_WIDTH = $('#content').innerWidth();
        Horse.GAME_HEIGHT = $('#content').innerHeight();
    };
    Horse.Preloader.prototype = {
        preload: function(){
            this.stage.backgroundColor = '#000';
            this.preloadBar = this.add.sprite((Horse.GAME_WIDTH-311)/2, (Horse.GAME_HEIGHT-27)/2, 'preloaderBar');
            this.load.setPreloadSprite(this.preloadBar);
            this.load.audio('music', '/games/horse/horse.ogg');
            this.load.image('bg1', '/games/horse/images/bg1.png');
            this.load.image('bg2', '/games/horse/images/bg2.png');
            this.load.image('bg3', '/games/horse/images/bg3.png');
            this.load.image('bg4', '/games/horse/images/bg4.png');
            this.load.image('end1', '/games/horse/images/bg5.png');
            this.load.image('end2', '/games/horse/images/bg6.png');
            this.load.spritesheet('horse1', '/games/horse/images/horse1.png', 109, 61);
            this.load.spritesheet('horse2', '/games/horse/images/horse2.png', 109, 61);
            this.load.spritesheet('horse3', '/games/horse/images/horse3.png', 109, 61);
            this.load.spritesheet('horse4', '/games/horse/images/horse4.png', 109, 61);
            this.load.spritesheet('horse5', '/games/horse/images/horse5.png', 109, 61);
            this.load.spritesheet('horse6', '/games/horse/images/horse6.png', 109, 61);
            this.load.spritesheet('start', '/games/horse/images/start.png', 159, 55);
            this.load.image('select', '/games/horse/images/select.png');
        },
        create: function(){
            this.state.start('MainMenu');
        }
    };
    Horse.MainMenu = function(game){};
    Horse.MainMenu.prototype = {
        create: function(){
            //var select = this.add.sprite(this.game.world.centerX-340, this.game.world.centerY-208, 'select');
            //var start = this.add.button(this.game.world.centerX+181, this.game.world.centerY+153, 'start', function(){}, this, 1, 0);
            //选马列表
            //var style = { font: "14px Arial", fill: "#fff", align: "center" };
            //var text = this.add.text(this.world.centerX-295, this.world.centerY-125, "1          超人1                              3                        14%", style);
            //text.anchor.set(0.5);
            //horse1.animations.add('run');
            //horse1.animations.play('run', 5, true);
            this.game.horse = new Game(this, this.game.socket);
        }
    };
    window.Horse = Horse;
})();