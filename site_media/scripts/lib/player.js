var me;
localground.player = function(){
    this.activeControl = null;
    this.mp3URL = null;
    this.position = 0;
    this.duration = 0;
    this.timelineWidth = 125;
    this.sliderWidth = 30;
    this.sliderPositionMin = 0;
    this.sliderPositionMax = null;
    this.sliderPosition = null;
    this.disableAdvancing = false;
};

localground.player.prototype.initialize = function($elem) {
    me = this;
    if($elem == null)
        $elem = $('body');
    $elem.find('.play').click(function(){ me.play(this); });
    $elem.find('.pause').click(function(){ me.pause(this); });
    $elem.find('.stop').click(function(){ me.stop(this); });
    $elem.find('.playerslider')
        .draggable({
            containment: 'parent',
            stop: function(e) {
                me.setPosition(this, $(this).position().left);
                me.disableAdvancing = false;
            },
            drag: function() {
                me.disableAdvancing = true;
            }
        });
    $elem.find('.timeline').click(function(e) {
        me.setPosition(this, e.pageX - this.offsetLeft - 10);
    });
};

localground.player.prototype.renderPlayerObject = function() {
    var $player = $('<div />').addClass('playercontroller');
    $player.append(
        $('<div />').addClass('button play')
            .append($('<a />').html('PLAY'))       
    ).append(
        $('<div />').addClass('button pause')
            .append($('<a />').html('PAUSE'))       
    ).append(
        $('<div />').addClass('button stop')
            .append($('<a />').html('STOP'))       
    ).append(
        $('<div />').addClass('timeline')
            .append(
                $('<a />')
                    .attr('href', '#slider')
                    .addClass('playerslider')
                    .html('SLIDER'))       
    ).append(
        $('<div />').addClass('counter')
            .append(
                $('<span />')
                    .addClass('elapsed')
                    .html('00:00')
            ).append('|')
            .append(
                $('<span />')
                    .addClass('duration')
                    .html('00:00')
            )
    );
    this.initialize($player);
    var $input = $('<input />').attr('type', 'hidden');
    return $('<div />').append($player).append($input);
};

localground.player.prototype.renderFlashObject = function(opts) {
    var listenerFunction = 'driver.audioManager.player';
    if(opts && opts.listenerFunction != null)
        listenerFunction = opts.listenerFunction;
    var $flashObj = $('<object />')
        .addClass('playerpreview')
        .attr('id', 'myFlash')
        .attr('type', 'application/x-shockwave-flash')
        .attr('data', '/site_media/scripts/lib/audio-player/player_mp3_js.swf')
        .attr('width', '1')
        .attr('height', '1');
    $flashObj.append(
            $('<param />')
                .attr('name', 'movie')
                .attr('value', '/site_media/scripts/lib/audio-player/player_mp3_js.swf')
        ).append(
            $('<param />')
                .attr('name', 'AllowScriptAccess')
                .attr('value', 'always')    
        ).append(
            $('<param />')
                .attr('name', 'FlashVars')
                .attr('value', 'listener=' + listenerFunction + '&amp;interval=1000')
        );
    return $flashObj;
}

localground.player.prototype.onInit = function() {
    this.position = 0;    
};

localground.player.prototype.formatMilliseconds = function(milliseconds) {
    var x = milliseconds / 1000.0;
    var seconds = parseInt(x % 60.0);
    x /= 60;
    var minutes = parseInt(x % 60.0);
    x /= 60;
    var hours = parseInt(x % 24.0);
    str = '';
    if(hours > 0) { str+=this.pad(hours, 2) + ':'; }
    str+=this.pad(minutes, 2) + ':';
    str+=this.pad(seconds, 2);
    return str;
};

localground.player.prototype.pad = function(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};

localground.player.prototype.onUpdate = function() {
    var isPlaying = (this.isPlaying == "true");
    this.sliderPositionMax = this.sliderPositionMin + this.timelineWidth - this.sliderWidth;
    this.sliderPosition = this.sliderPositionMin + Math.round((this.timelineWidth - this.sliderWidth) * this.position / this.duration);
    if (this.sliderPosition < this.sliderPositionMin)
        this.sliderPosition = this.sliderPositionMin;
    if (this.sliderPosition > this.sliderPositionMax)
        this.sliderPosition = this.sliderPositionMax;
    if(this.activeControl) {
        this.activeControl.parent().find('.elapsed').html(this.formatMilliseconds(this.position));
        this.activeControl.parent().find('.duration').html(this.formatMilliseconds(this.duration));
        
        this.activeControl.find('.play').css({
            'display': (isPlaying)?'none':'block'    
        });
        this.activeControl.find('.pause').css({
            'display': (isPlaying)?'block':'none'    
        });
        if(!this.disableAdvancing) { //only advance slider if not dragging
            this.activeControl.find('.playerslider').css({
                'left': this.sliderPosition  
            });
        }
    }
};

localground.player.prototype.flashPlayer = function() {
    return document.getElementById("myFlash");
};

localground.player.prototype.reset = function() {
    this.position = 0;
    if(this.activeControl == null) { return; }
    this.activeControl.find('.play').css({
        'display': 'block'    
    });
    this.activeControl.find('.pause').css({
        'display': 'none'    
    });
    this.activeControl.find('.playerslider').css({
        'left': this.sliderPositionMin  
    });
};

localground.player.prototype.play = function(elem) {
    if (this.mp3URL != $(elem).parent().next().val()) {
        this.reset();                           //resets previous player
        this.activeControl = $(elem).parent();  //sets new active control
        this.mp3URL = this.activeControl.next().val();
    }
    if (this.position == 0) {
        this.flashPlayer().SetVariable("method:setUrl", this.mp3URL);
    }
    this.flashPlayer().SetVariable("method:play", "");
    this.flashPlayer().SetVariable("enabled", "true");
};

localground.player.prototype.pause = function(elem) {
    me.flashPlayer().SetVariable("method:pause", "");
};

localground.player.prototype.stop = function(elem) {
    me.flashPlayer().SetVariable("method:stop", "");
};

localground.player.prototype.setPosition = function(elem, pos) {
    //check to see if elem is a child of the active control:
    if(this.activeControl != null && this.activeControl.has($(elem)).length > 0) {
        this.position = pos*this.duration/(this.timelineWidth-this.sliderWidth)
        me.flashPlayer().SetVariable("method:setPosition", this.position);
    }
};

localground.player.prototype.setVolume = function() {
    var volume = document.getElementById("inputVolume").value;
    me.flashPlayer().SetVariable("method:setVolume", volume);
};