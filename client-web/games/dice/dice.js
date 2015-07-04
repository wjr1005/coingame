define(function(){
    var config = {
        my :{
            username : '',
            balance : 0
        },
        bet : {
            house_edge : 0.01,
            max_win_odds : 98,
            min_win_odds : 0.0001
        }
    };
    var COIN = 100000000;
    var g_is_lock_bet = 1;
    var Timer;
    var connectSuccess = "Connect the dice server successfully";
    var connectError = "Connect dice server failed";
    var disconnected = "Disconnect the dice server connection";

    var util = {
        'random_str': function(length) {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
            length = length || 32;
            var str = '';
            for (var i = 0; i < length; i++) {
                str += chars[Math.floor(randomEx() * chars.length)];
            }
            return str;
        },
        'multiper': function(change_to_win) {
            return share.toNumber((1 - config.bet.house_edge)/change_to_win*100);
        },
        'win_odds': function(multiper) {
            return share.toNumber((1 - config.bet.house_edge)*100/multiper, 4);
        },
        getRollHi : function(chanceToWin){
            return 100-chanceToWin-0.0001;
        }
    };

    var Dice = {
        get_balance : function(){
            var balance = $('#user_balance').html().replace(',', '').replace(/<[^>]*>/ig, '');
            return share.toNumber(balance) * 1.0;
        },
        get_site_max_profit : function(){
            var site_max_bet_profit = parseFloat($('#site_max_bet_profit').text());
            return site_max_bet_profit;
        },
        refresh_bet_options : function(){
            var win_odds = share.toNumber($('#win_odds').val());
            if (win_odds > config.bet.max_win_odds) {
                win_odds = config.bet.max_win_odds;
                $('#win_odds').val(config.bet.max_win_odds);
            } else if (win_odds < config.bet.min_win_odds) {
                win_odds = config.bet.min_win_odds;
                $('#win_odds').val(config.bet.min_win_odds);
            }
            var mul = util.multiper(win_odds);
            var bet_amount = share.toNumber($("#bet_amount").val());
            var user_balance = this.get_balance();
            $('#payout').val(mul.toString());
            $.cookie('payout', mul.toString());
            var bet_profit = share.toNumber((mul - 1) * bet_amount);
            $('#bet_profit').val(bet_profit);

            var roll_hi = share.toNumber((100 - win_odds - 0.0001), 4);
            $("#roll_low").html(win_odds.toFixedEx(4));
            $("#roll_high").html(roll_hi);

            var site_max_profit = this.get_site_max_profit();
            // can't bet
            if ((bet_amount > 0 && bet_profit < 1/COIN) || /* profix is zero */
                bet_profit > site_max_profit || /* profit is more than site profit */
                (user_balance > 0 && user_balance < bet_amount))
            {
                this.lock_bet();
                //警告
                if (bet_profit > site_max_profit) {
                    this.toastr['warning']('Maximum profit for each bet is currently:'+site_max_profit);
                    $('#bet_profit').parent().addClass('error');
                } else if (user_balance < bet_amount) {
                    $("#bet_amount").val(user_balance);
                    setTimeout(this.refresh_bet_options, 0);
                    return;
                } else if (bet_amount > 0 && bet_profit < 1/COIN) {
                    this.toastr['warning']('"Bet Amount" Minimum is 0.00000001');
                    $('#bet_profit').parent().addClass('error');
                }
            }
            else
            {
                //清除警告
                this.unlock_bet();
            }
        },
        lock_bet : function () {
            //this.cfpLoadingBar.start();
            $("#bet_buttons button").addClass('disabled');
            $("#mtg_btns button").addClass('disabled');
            $("#simple_btns button").addClass('disabled');
            g_is_lock_bet = 1;
        },
        unlock_bet : function () {
            clearTimeout(Timer);
            //this.cfpLoadingBar.complete();
            $("#bet_buttons button").removeClass('disabled');
            g_is_lock_bet = 0;
        },
        bet_do : function (is_roll_high) {
            var self = this;
            if (g_is_lock_bet == 1) { return; }
            Timer = setTimeout(function(){
                self.toastr['warning']('Betting timeout');
                self.unlock_bet();
            },5000);

            var win_odds = share.toNumber($('#win_odds').val());
            var bet_amount = share.toNumber($('#bet_amount').val());
            // check params
            if (win_odds <= 0 || win_odds >= 980000) {
                this.toastr['error']('win odds is invalid');return;
                $('#win_odds').parent().addClass('error');
            }
            if (bet_amount < 0) {
                this.toastr['error']("bet amount is invalid");return;
                $('#bet_amount').parent().addClass('error');
            }
            this.lock_bet();
            var data = {};
            data.chanceToWin = win_odds;
            data.bet = bet_amount;
            data.isRollHigh = is_roll_high;
            self.socket.emit('bet', data);
            if (is_roll_high) {
                $("#btn_roll_high").addClass('disabled');
            } else {
                $("#btn_roll_low").addClass('disabled');
            }
        },
        ChangeCoin : function (coin)
        {
            $('#coin').text(share.coinToShortName(coin));
            var amount = (0).toFixedEx(8);
            $('#bet_amount').val(amount);
            $.cookie('bet_amount',amount);
            this.socket.emit('coin', coin);
        },
        NumberToSmall : function (text)
        {
            text = text + '';
            var tempList = text.split('.');
            if (tempList.length == 2)
                return tempList[0]+'.<small>'+tempList[1]+'</small>';
            return text;
        },
        addAdorn : function (text){
            if (parseFloat(text) > 0)
                return '+'+text;
            return text;
        },
        showMyBet :function (){
            self.socket.emit('showMyBet', null);
        },
        initSocket : function ()
        {
            var self = this;
            this.cfpLoadingBar.start();
            self.socket.connect(DiceServer);
            self.socket.on('connect', function(data){
                self.cfpLoadingBar.complete();
                self.unlock_bet();
                var coin = $.cookie('coin');
                setTimeout(function(){self.socket.emit('init', coin);}, 300);
            });
            self.socket.on('error', function(){
                self.toastr['warning'](connectError);
            });
            self.socket.on('connect_error', function(data){
                self.lock_bet();
            });
            self.socket.on('disconnect', function(data){
                self.lock_bet();
            });
            self.socket.on('init', function(data){
                self.cfpLoadingBar.complete();
                var coin = data.coin;
                if (coin != $.cookie('coin')) return;
                if (data.username) config.my.username = data.username;
                if (typeof(data.bank) != 'undefined')
                {
                    $('#bank').text(data.bank.toFixed(4));
                    var site_max_bet_profit = data.maxBet.toFixed(4);
                    $('#site_max_bet_profit').text(site_max_bet_profit*1.0);
                }
                if (typeof(data.siteBet) != 'undefined')
                    $('#site_bet').text(data.siteBet.toFixed(4));
                if (typeof(data.userBalance) != 'undefined')
                    $('#user_balance').text(data.userBalance.toFixed(8));
                if (typeof data.userWins != 'undefined')
                    $('#user_wins').text(data.userWins);
                if (typeof data.userLosses != 'undefined')
                    $('#user_losses').text(data.userLosses);
                if (typeof data.userBet != 'undefined')
                    $('#user_bet').text(data.userBet.toFixed(8));
                if (typeof data.userProfit != 'undefined')
                    $('#user_profit').text(data.userProfit.toFixed(8));
            });
            self.socket.on('my', function(data){
                config.my.username = data.username;
                config.my.balance = data.balance.toFixed(8);
                $('#user_balance').text(config.my.balance);
                $('#user_bet').text(data.bet.toFixed(8));
                $('#user_profit').text(data.profit.toFixed(8));
                $('#user_wins').text(data.wins);
                $('#user_losses').text(data.losses);
            });
            self.socket.on('result', function(data){
                self.unlock_bet();
                for (var i = data.length - 1; i >=0; i--)
                {
                    var item = data[i];
                    var m = item.isWin?'win':'lose';
                    var condition = item.isRollHigh?'>'+util.getRollHi(item.chanceToWin).toFixedEx(4):'<'+item.chanceToWin.toFixedEx(4);
                    self.scope.resultList.unshift({id: item['id'], class:m, username:item['username'], date:item['date'], lucky:self.NumberToSmall(item['lucky']),
                        condition:condition, coin:item['coin'], bet:self.NumberToSmall(item['bet'].toFixedEx(8)), payout:self.NumberToSmall(item['payout'].toFixedEx(8)), profit:self.NumberToSmall(self.addAdorn(item['profit'].toFixedEx(8)))});
                    //<img title="'+country+'" src="/country/'+coCode+'.png">
                    //var result = '<tr class="'+m+'"><td>'+item['username']+'</td><td>'+share.toTimeStr(item['date'])+'</td><td><a href="javascript:void(0)" ng-click="roll('+item['id']+');">'+item['id']+'</a></td>' +
                    //    '<td class="text">'+self.NumberToSmall(item['lucky'])+'</td><td>'+condition+'</td><td class="text">'+self.NumberToSmall(item['bet'].toFixedEx(8))+'<span class="label label-default" style="font-size: 10px">'+share.coinToShortName(item['coin'])+'</span></td><td>'+
                    //    self.NumberToSmall(item['payout'].toFixedEx(8))+'x</td><td class="text">'+self.NumberToSmall(self.addAdorn(item['profit'].toFixedEx(8)))+'<span class="label label-default" style="font-size: 10px">'+share.coinToShortName(item['coin'])+'</td></tr>';
                    if (config.my.username == item['username'])
                    {
                        self.scope.myResultList.unshift({id: item['id'], class:m, username:item['username'], date:item['date'], lucky:self.NumberToSmall(item['lucky']),
                            condition:condition, coin:item['coin'], bet:self.NumberToSmall(item['bet'].toFixedEx(8)), payout:self.NumberToSmall(item['payout'].toFixedEx(8)), profit:self.NumberToSmall(self.addAdorn(item['profit'].toFixedEx(8)))});
                    //    var result2 = '<tr class="'+m+'"><td>'+item['username']+'</td><td>'+share.toTimeStr(item['date'])+'</td><td><a href="javascript:void(0)" ng-click="roll('+item['id']+');">'+item['id']+'</a></td>' +
                    //        '<td class="text">'+self.NumberToSmall(item['lucky'])+'</td><td>'+condition+'</td><td class="text">'+self.NumberToSmall(item['bet'].toFixedEx(8))+'<span class="label label-default" style="font-size: 10px">'+share.coinToShortName(item['coin'])+'</span></td><td>'+
                    //        self.NumberToSmall(item['payout'].toFixedEx(8))+'x</td><td class="text">'+self.NumberToSmall(self.addAdorn(item['profit'].toFixedEx(8)))+'<span class="label label-default" style="font-size: 10px">'+share.coinToShortName(item['coin'])+'</td></tr>';
                    //    $("#myBets").prepend(result2);
                    }
                    //$("#allBets").prepend(result);
                }
                if (self.scope.resultList.length > 50)
                    self.scope.resultList.pop();
                if (self.scope.myResultList.length > 50)
                    self.scope.myResultList.pop();
            })
            self.socket.on('myResult', function(data){
                self.scope.myResultList = [];
                for (var i = data.length - 1; i >=0; i--)
                {
                    var item = data[i];
                    var m = item.isWin?'win':'lose';
                    var condition = item.isRollHigh?'>'+util.getRollHi(item.chanceToWin).toFixedEx(4):'<'+item.chanceToWin.toFixedEx(4);
                    self.scope.myResultList.unshift({id: item['id'], class:m, username:item['username'], date:item['date'], lucky:self.NumberToSmall(item['lucky']),
                        condition:condition, coin:item['coin'], bet:self.NumberToSmall(item['bet'].toFixedEx(8)), payout:self.NumberToSmall(item['payout'].toFixedEx(8)), profit:self.NumberToSmall(self.addAdorn(item['profit'].toFixedEx(8)))});
                }
            });
            self.socket.on('msg', function(data){
                self.unlock_bet();
                var msg = '';
                try
                {
                    msg = data.msg;
                }
                catch(e){}
                self.toastr[data.type](msg);
            })
        },
        initUi : function(toastr, cfpLoadingBar, socket, scope) {
            this.toastr = toastr;
            this.cfpLoadingBar = cfpLoadingBar;
            this.socket = socket;
            this.scope = scope;
            var self = this;

            self.initSocket();
            $('#bet_amount').val($.cookie('bet_amount')?$.cookie('bet_amount'):0);
            $('#payout').val($.cookie('payout')?$.cookie('payout'):2);

            $('#payout').keyup(function() {
                var payout = share.toNumber($(this).val());
                if (payout == 0) payout = 49.5;
                var val = (1 - config.bet.house_edge) * 100 / payout;
                $('#win_odds').val((val.toString().toFixedEx(4))*1.0);
                self.refresh_bet_options();
            });
            $('#win_odds').keyup(function() {
                var win_odds = share.toNumber($(this).val());
                var val = share.toNumber((1 - config.bet.house_edge)*100/win_odds);
                $('#payout').val(val);
                self.refresh_bet_options();
            });
            $('#bet_amount').keyup(function() {
                $.cookie('bet_amount',$(this).val().toFixedEx(8));
                self.refresh_bet_options();
            });
            $("#btn_roll_high").click(function() { self.bet_do(1); });
            $("#btn_roll_low").click(function() { self.bet_do(0); });
            $('#plus').click(function(){
                var win_odds = share.toNumber($('#win_odds').val());
                win_odds++;
                $('#win_odds').val(win_odds.toFixedEx(8)*1.0);
                self.refresh_bet_options();
            });
            $('#minus').click(function(){
                var win_odds = share.toNumber($('#win_odds').val());
                win_odds--;
                if (win_odds <= 0) win_odds = 0;
                $('#win_odds').val(win_odds.toFixedEx(8)*1.0);
                self.refresh_bet_options();
            });
            $('#double').click(function(){
                var bet_amount = share.toNumber($('#bet_amount').val());
                $('#bet_amount').val(share.toNumber(bet_amount*2));
                self.refresh_bet_options();
            });
            $('#half').click(function(){
                var bet_amount = share.toNumber($('#bet_amount').val());
                $('#bet_amount').val(share.toNumber(bet_amount/2));
                self.refresh_bet_options();
            });
            $('#o_min').click(function(){
                $('#win_odds').val(config.bet.min_win_odds);
                self.refresh_bet_options();
            });
            $('#o_max').click(function(){
                $('#win_odds').val(config.bet.max_win_odds);
                self.refresh_bet_options();
            });
            $('#b_min').click(function(){
                $('#bet_amount').val(0.00000001.toFixedEx(8));
            });
            $('#b_max').click(function(){
                $('#bet_amount').val($('#site_max_bet_profit').text().toFixedEx(8));
            });
            $('#payout').keyup();
        }
    };
    return Dice;
});