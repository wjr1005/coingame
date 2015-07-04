
(function($){
	var coinList = ['aur.png', 'btc.png', 'doge.png', 'ltc.png', 'nxt.png', 'pts.png'];
    var minSize = 10,
        maxSize = 64,
        newOn   = 300,
        documentHeight = $(document).height(),
        documentWidth  = $(document).width();
    var interval = null;
    var count = 0;
    var opacity = 1;
	$.fn.snow = function(snowList, sound, backfun){
        count = 0;
            clearInterval(interval);
			interval		= setInterval( function(){
                //console.log(snowList)
                var r = Math.ceil(rnd()*snowList.length)-1;
                var snow = snowList.splice(r,1)[0];
                if (!snow)
                    return clearInterval(interval);
                //document.getElementById("snow_msg").play();
                //SnowSound.play();
                sound();
				var startPositionLeft 	= Math.random() * documentWidth - 100,
				 	//startOpacity		= 0.5 + Math.random(),
					endPositionTop		= documentHeight - 40,
					endPositionLeft		= startPositionLeft - 100 + Math.random() * 500,
					durationFall		= documentHeight * 10 + Math.random() * 5000,
                    sizeFlake			= minSize + Math.random() * maxSize;
                //var n = Math.floor(Math.random()*coinList.length);
                var $flake 			= $('<div id="snow_'+snow[0]+'" data="'+snow[0]+'" class="snowbox" />').css({'position': 'absolute', 'top': '-50px', 'z-index':20}).html('<img src="/public/images/coin/'+snow[1].toLowerCase()+'.png">');
				$flake.appendTo('body').css({
							left: startPositionLeft,
							//opacity: opacity,
							width: sizeFlake,
                            height:sizeFlake
						}).animate({
							top: endPositionTop,
							left: endPositionLeft
							//opacity: opacity
						},durationFall,'linear',function(){
							$(this).remove()
						}
                ).on('click',function(){
                        if (opacity == 0.5) return;
                        backfun($(this).attr('data'));
                        opacity = 0.5;
                        $('.snowbox').each(function(){
                            $(this).css('opacity', 0.5);
                        });
                        setTimeout(function(){
                            opacity = 1;
                            $('.snowbox').each(function(){
                                $(this).css('opacity', opacity);
                            });
                        }, 1000)
                });
                count += 1;
			}, newOn);
	};
    $.fn.snowStop = function(){
        clearInterval(interval);
    };
})(jQuery);