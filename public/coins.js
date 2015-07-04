(function (exports) {
    Coins = exports.Coins = {
        'BitCoin':{shortName:'BTC', limit:0.0001, length:8, wallet:true, investment:true, bonus:true},
        'LiteCoin':{shortName:'LTC', limit:0.001, length:8, wallet:true, investment:true, bonus:true, trade:true},
        'DogeCoin':{shortName:'DOGE', limit:0.001, length:4, wallet:true, investment:true, bonus:true, trade:true},
        'Ripple':{shortName:'XRP', limit:1, length:2, wallet:true, investment:true, bonus:true, trade:true},
        'DarkNetCoin':{shortName:'DNC', length:4,  limit:0.1, wallet:true, investment:true, bonus:true, brush:false, trade:true},
        'Stellar':{shortName:'STR', length:4,  limit:1, wallet:true, investment:true, bonus:false, trade:true},
        'InternalStock':{shortName:'IS', wallet:false, investment:false, bonus:false, transfer:false, trade:true},
        //股票
        'CoinGame' : {shortName:'CGS', fullName:'币游平台股票', quantity:30000000, overview:'', investment:true, wallet:false, isStock:true, trade:true},
        //'BlackJack' : {shortName:'BJ', fullName:'21点', quantity:1000, overview:'', weallet:false, isStock:true, trade:true}
    };
})( (function(){
    if(typeof exports === 'undefined') {
        return window;
    } else {
        return module.exports;
    }
})() );
