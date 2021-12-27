function playAudio(src) {
    var $player = $('.nft-player');
    var $progressBar = $player.find('.nft-player-progress i');
    var $progressRange = $player.find('.nft-player-progress input[type=range]');
    var $playBtn = $player.find('.nft-player-play');
    var $stopBtn = $player.find('.nft-player-stop');
    var $currTime = $player.find('[data-curr]');
    var $duration = $player.find('[data-duration]');
    var timer = function (callback) {
        var _timer;
        return {
            start: function () {
                if (_timer) {
                    return;
                }
                _timer = setInterval(callback, 1000);
            },
            stop: function () {
                clearInterval(_timer);
                _timer = null;
            }
        }
    };
    var nAudio = new Audio();
    var miniPlayer = {
        init: function () {
            this.onDrag = false;
            nAudio.src = src; // 播放地址
            nAudio.autoplay = "autoplay"; // 自动播放
            nAudio.loop = false; // 不循环
            this.timer = timer($.proxy(this.updatePos, this));
            this.bindEvents();
            // this.play();
        },
        bindEvents: function () {
            var self = this;

            nAudio.addEventListener("loadeddata", function () {
                self.play();
            });

            // nAudio.addEventListener("loadedmetadata", function () {
            //     self.play()
            // });
            nAudio.addEventListener("playing", function (e) {
                $playBtn.addClass('nft-player-pause');
            });
            nAudio.addEventListener("ended", function () {
                self.stop();
                // self.play();//单曲循环
            });
            $progressRange
                .bind('touchstart', function (e) {
                    self.onDrag = true;
                    var touches = e.originalEvent.touches;
                    if (touches.length > 0) {
                        var x = touches[0].clientX;
                        var percent = (x - $(this).offset().left) / this.clientWidth * 100;

                        self.updateProgressBar(percent, true);
                    }
                })
                .bind('touchmove', function () {
                    self.onDrag = true;
                    self.updateProgressBar(this.value, false);
                })
                .bind('touchend', function () {
                    self.onDrag = false;
                    self.setProgress(this.value, false);
                });
            $playBtn.bind('click', function () {
                if ($(this).hasClass('nft-player-pause')) {
                    self.pause();
                } else {
                    self.play();
                }
            });
            $stopBtn.bind('click', function () {
                self.stop();
            });
        },
        updateProgressBar: function (percent, withRange) {
            this.progress = percent;
            $progressBar.width(percent + '%');
            if (withRange) {
                $progressRange.val(percent);
            }
        },
        setProgress: function (percent, withRange) {
            if (this.duration === 0) {
                percent = 0;
                withRange = true;
            }
            this._currTime = (this.duration * percent / 100) || 0;
            this.currTime = this.formatTime(this._currTime);
            $currTime.text(this.currTime);
            this.updateProgressBar(percent, withRange);
            this.setCurrTime();
        },
        setCurrTime: function () {
            nAudio.currentTime = this._currTime;
        },
        pause: function () {
            $playBtn.removeClass('nft-player-pause');
            nAudio.pause();
            this.timer.stop();
        },
        play: function () {
            nAudio.play();
            this.timer.start();
        },
        stop: function () {
            this.setProgress(0, true);
            this.pause();
        },
        updatePos: function () {
            var i = nAudio.currentTime;
            var min = ~~(i / 60),
                sec = ~~(i % 60);
            this._currTime = i;
            this.currTime = this.formatTime(i);
            $currTime.text(this.currTime);

            var duration = nAudio.duration || 0;
            if (this.duration !== duration) {
                this.duration = duration;
                var _durationTime = this.formatTime(duration);
                $duration.text(_durationTime);
            }
            if (this.onDrag) return;
            var precent = this._currTime === 0 ? 0 : Math.ceil(this._currTime / this.duration * 100)
            this.updateProgressBar(precent, true);
        },
        formatTime: function (timestamp) {
            var min = ~~(timestamp / 60),
                sec = ~~(timestamp % 60);
            return [(min < 10 ? "0" + min : min), (sec < 10 ? "0" + sec : sec)].join(":");
        }
    };
    miniPlayer.init();
    return nAudio
}