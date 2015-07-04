var FloatMsgTimer;

function showFloatMsg(type, msg)
{
    try{window.clearInterval(FloatMsgTimer);}catch(e){}
    //msg = i18n.t(msg);
    $('#FloatMessage').removeClass();
    $('#FloatMessage').html(msg);
    $('#FloatMessage').addClass(type);
    $('#FloatMessage').fadeIn(1000);
    FloatMsgTimer = setTimeout(function(){
        $('#FloatMessage').fadeOut(1000,function(){
            $(this).html('');
            $(this).removeClass();
        });
    }, 1000*3);
}

function showMsg(id, type, msg)
{
    //var html = '<div class="alert alert-'+type+'"><button ng-click="close()" type="button">×</button><strong>'+msg+'</strong></div>';
    var html = '<alert type="'+type+'" close="closeAlert($index)">'+msg+'</alert>';
    $("#"+id).html(html);
}

function showLoading(){
    $('.loading').show();
    $('button').addClass('disabled');
}

function hideLoading(){
    $('.loading').hide();
    $('button').removeClass('disabled');
}

function Notice()
{
    var n = $('#notice').attr('data');
    if (n != 0 && n != $.cookie('notice'))
    {
        $('#notice .alert').show();
        //$('#notice').css('margin-bottom', '10px');
    }
    $('#notice .close').click(function(){
        $.cookie('notice', n);
    });
}

//循环播放声音
function loopSound(sound) {
    sound.play({
        onfinish: function() {
            loopSound(sound);
        }
    });
}

//进入全屏
function requestFullScreen() {
    var de = document.documentElement;
    if (de.requestFullscreen) {
        return de.requestFullscreen();
    } else if (de.mozRequestFullScreen) {
        return de.mozRequestFullScreen();
    } else if (de.webkitRequestFullScreen) {
        return de.webkitRequestFullScreen();
    }
}
//退出全屏
function exitFullscreen() {
    var de = document;
    if (de.exitFullscreen) {
        return de.exitFullscreen();
    } else if (de.mozCancelFullScreen) {
        return de.mozCancelFullScreen();
    } else if (de.webkitCancelFullScreen) {
        return de.webkitCancelFullScreen();
    }
}

function resizeGame(name, game) {
    var height = $('#'+name).innerHeight();
    var width = $('#'+name).innerWidth();

    game.width = width;
    game.height = height;
    game.stage.bounds.width = width;
    game.stage.bounds.height = height;

    if (game.renderType === Phaser.WEBGL)
    {
        game.renderer.resize(width, height);
    }
}

function AddWinning(msg)
{
    var winning = $('#winning');
    if (winning.css('display') == 'none')
    {
        winning.show();
        winning.removeClass('bounceOutDown');
        winning.addClass('animated bounceInUp');
    }
    var f = $('<li>'+msg+'</li>').appendTo("#winning ul");
    setTimeout(function(){
        $(f).fadeOut(1000, function(){
            $(f).remove();
            if ($("#winning ul li").size() == 0)
            {
                winning.removeClass('bounceInUp');
                winning.addClass('animated bounceOutDown');
                setTimeout(function(){
                    winning.hide();
                }, 2000);
            }
        })
    }, 1000*5);
}