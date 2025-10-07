(function (window) {
    /**
     * 通用工具集合
     * 使用方法$echo.get(接口地址,参数，设置对象).then((res)=>{})
     */
    // 定义通用变量
    function Echo() {
        this.VERSION = '0.04';
        this.apiUrl = "";
    }

    // 定义通用方法
    Echo.prototype = {
        // 初始
        startInit: function () {
            self = this;
            this.addLink("css/bootstrap.css");
            this.addScript('./js/vue.js', false);
            // 加载通用css
            // this.addLink("css/vant.css");
            // 加载通用js
            // this.addScript('./js/libs/jquery.min.js');
            // this.addScript('./js/layer/layer.js');
            // this.addScript('./js/api.js');
            // // vue文件和faskclick移动端点击
            // this.addScript('./js/libs/vue.js', function () {
            //     this.addScript('./js/libs/faskclick.js', function(){
            //         this.addFastclick();
            //     }.bind(this));
            //     // this.addScript('./js/libs/vant.mini.js');
            // }.bind(this));
        },
        constructor: Echo,
        // 检测本地版本是否一致
        checkVersion: function (key) {
            var versionL = this.getStorage('VERSION')
            if (versionL) {
                var is = versionL.some(item => {
                    return item[key] === this.VERSION
                })
                if (!is) {
                    this.removeStorage(key); // 清除本地数据
                    sessionStorage.clear();
                    if (INDEXDB) INDEXDB.deleteItem(key); // 清除indexdb数据
                    versionL.push({
                        [key]: this.VERSION
                    })
                    this.setStorage('VERSION', versionL);
                }
            } else {
                this.removeStorage(key); // 清除本地数据
                sessionStorage.clear();
                if (INDEXDB) INDEXDB.deleteItem(key); // 清除indexdb数据
                this.setStorage('VERSION', [{
                    [key]: this.VERSION
                }])
            }
        },
        /**
         * ajax方法
         * @param url 接口地址
         * @param params 参数
         * @param type  请求类型
         */
        ajax: function (url, params, type, opt) {
            return this.ajaxBin(url, type, params, opt).then(function (res) {
                return res;
            }, function (err) {
                return err;
            })
        },

        // get请求
        get: function (url, params, opt) {
            return this.ajax(url, params, 'get', opt);
        },

        // post请求
        post: function (url, params, opt) {
            params = JSON.stringify(params);
            return this.ajax(url, params, 'post', opt);
        },


        getJson: function (url, config) {
            opt = {
                headers: {
                    'Cache-Control': 'public,max-age=7200', //不缓存
                    'Content-Type': 'application/json'
                }
            }
            if(config) Object.assign(opt,config)
            return fetch(url, opt).then((res) => {
                if (res.ok) {
                    // text() 获取字符串，json()获取json数据
                    return res.json()
                } else {
                    if(res.status === 404) {
                        alert('当前网页维护中...，请点击确定关闭')
                        window.close();
                    }
                    // 服务器异常
                    throw Error('')
                }
            }).catch((error) => {
                console.log('errorMessage', error)
            })
        },

        // ajax 核心函数
        ajaxBin: function (url, type, params, opt) {
            if (!$.isPlainObject(opt)) {
                var opt = {
                    mask: false
                }
            }
            var index = '';
            return $.ajax({
                // url: this.apiUrl + url,
                url: url,
                data: params || {},
                type: type || 'get',
                async: opt.async || false,
                dataType: opt.dataType || 'json',
                timeout: opt.timeout || 15000,
                contentType: opt.contentType || 'application/json;charset=UTF-8',
                headers: {
                    ...opt.headers
                },
                beforeSend: function () {
                    if (opt.mask) {
                        index = self.showLoading();
                    }
                },
                complete: function () {
                    if (opt.mask) self.hideLoading(index)
                }
            });
        },

        // 显示加载动画
        showLoading: function (msg) {
            return layer.open({
                type: 2,
                content: msg || '加载中'
            });
        },

        // 隐藏加载动画
        hideLoading: function (index) {
            layer.close(index)
        },


        // 提示框
        layerMsg: function (msg, time) {
            layer.open({
                content: msg,
                skin: 'msg',
                time: time || 2 //2秒后自动关闭
            });
        },

        // 询问框
        layerAlert: function (opt) {
            layer.open({
                content: opt.msg,
                btn: opt.btn || ['确定', '取消'],
                yes: function (index) {
                    if (opt.yes) {
                        opt.yes(index);
                    }
                    if (opt.close) {
                        layer.close(index);
                    }
                },
                no: function () {
                    if (opt.no) opt.no();
                },
                end: function (index) {
                    if (opt.end) opt.end(index);
                }
            });
        },

        /**
         * @description 跳转url
         * @param url   url地址
         * @param params    参数对象
         */
        open: function (url, params, type) {
            var re = /(https?)|(.pdf)|(.html)/img
            if (re.test(url) === false) {
                url = url + '.html';
            }
            if (params && typeof params === 'object') {
                url = url + this.setUrlParam(params, true);
            }
            // 获取url
            if (type === 'get') {
                return url
            }else if (type) {
                window.open(url)
            } else {
                window.location.href = url
            }
        },

        // 获取url参数
        getParams: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        },

        /**
         * @description 设置url参数
         * @param obj 参数对象
         * @param fix 是否启用'?'
         * @return {string}
         */
        setUrlParam: function (obj, fix) {
            fix = fix ? '?' : '';
            var _rs = [];
            for (var p in obj) {
                if (obj[p] !== null && obj[p] !== '' && obj[p] !== undefined) {
                    if (typeof obj[p] === 'object') {
                        _rs.push(p + '=' + JSON.stringify(obj[p]))
                    } else {
                        _rs.push(p + '=' + obj[p])
                    }
                }
            }
            return fix + _rs.join('&');
        },

        /**
         * @description 获取url参数
         * @param url url地址
         * @return {Object}
         */
        getUrlParam: function (url) {
            url = url ? url : window.location.href;
            var _pa = url.substring(url.indexOf('?') + 1),
                _arrS = _pa.split('&'),
                _rs = {};
            for (var i = 0, _len = _arrS.length; i < _len; i++) {
                var pos = _arrS[i].indexOf('=');
                if (pos == -1) {
                    continue;
                }
                var name = _arrS[i].substring(0, pos),
                    value = window.decodeURIComponent(_arrS[i].substring(pos + 1));
                _rs[name] = value;
            }
            return _rs;
        },

        // 返回某个位置
        toTop: function (top, time) {
            top = top || 0;
            time = time || 300;
            $('body,html').stop().animate({
                scrollTop: top
            }, time)
            // $('body,html').stop().animate({ scrollTop: 0 }, 1000);
        },

        // 加入支付宝sdk
        setAliSdk: function () {
            if (navigator.userAgent.indexOf('AlipayClient') > -1) {
                document.writeln('<script src="https://appx/web-view.min.js"' + '>' + '<' + '/' + 'script>');
            }
        },

        // 数组去重
        removeR: function (arr, str) {
            for (var i = 0; i < arr.length; i++) {
                for (var j = i + 1; j < arr.length; j++) {
                    if (arr[i][str] == arr[j][str]) {
                        arr.splice(i, 1);
                        j--
                    }
                }
            }
            return arr;
        },

        // 正则
        regExp: function (str, type) {

        },

        // 判断浏览器类型
        getBrowser: function (type) {
            switch (type) {
                case 'android':
                    return navigator.userAgent.toLowerCase().indexOf('android') !== -1
                case 'iphone':
                    return navigator.userAgent.toLowerCase().indexOf('iphone') !== -1
                case 'ipad':
                    return navigator.userAgent.toLowerCase().indexOf('ipad') !== -1
                case 'weixin':
                    return navigator.userAgent.toLowerCase().indexOf('micromessenger') !== -1
                case 'pc':
                    return navigator.userAgent.toLowerCase().indexOf('windows') !== -1
                default:
                    return navigator.userAgent.toLowerCase()
            }
        },

        // 深度拷贝
        deepClone: function (obj) {
            if (!obj && typeof obj !== 'object') {
                return;
            }
            var newObj = obj.constructor === Array ? [] : {};
            for (var key in obj) {
                if (obj[key]) {
                    if (obj[key] && typeof obj[key] === 'object') {
                        newObj[key] = obj[key].constructor === Array ? [] : {};
                        //递归
                        newObj[key] = deepClone(obj[key]);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
            return newObj;
        },

        // 获取本地储存
        getStorage: function (k) {
            var data = localStorage.getItem(k);
            try {
                if (typeof JSON.parse(data) == "object") {
                    return JSON.parse(data)
                } else {
                    return data
                }
            } catch (e) {
                return data
            }
        },

        // 设置本地储存
        setStorage: function (k, v) {
            if (typeof v === 'object') {
                localStorage.setItem(k, JSON.stringify(v))
            } else {
                localStorage.setItem(k, v)
            }
        },

        // 删除本地储存
        removeStorage: function (k) {
            localStorage.removeItem(k)
        },

        /**
         * 打乱数组的顺序
         * @param arr  处理数组
         * @returns {Array.<T>|*} 打乱顺序的数组
         */
        upsetArr: function (arr) {
            return arr.sort(function () {
                return Math.random() - 0.5
            });
        },

        /**
         * 求数组的最大值
         * @param arr  数组
         * @returns {*} 数组重的最大值
         */
        maxArr: function (arr) {
            return Math.max.apply(null, arr);
        },

        /**
         * 求数组的最小值
         * @param arr 数组
         * @returns {*} 数组的最小值
         */
        minArr: function (arr) {
            return Math.min.apply(null, arr);
        },

        /**
         * @description 函数防抖(在事件被触发n毫秒后再执行回调，如果在这n毫秒内又被触发，则重新计时)
         * @param fn 执行函数
         * @param delay 间隔时间
         * @param first 间隔时间
         */
        debounce: function (fn, delay, first = false) {
            var _first = first;
            return function () {
                clearTimeout(fn.id);
                if (_first) {
                    fn.call(this, arguments);
                    _first = !_first;
                }
                fn.id = setTimeout(() => {
                    fn.call(this, arguments)
                }, delay)
            }
        },



        /**
         * @description 函数节流
         * @param fn 执行的函数
         * @param delay 延迟的时间
         * @param option 配置项 {first:true,last:true}
         */
        throttle: function (fn, delay, option = {}) {
            option = Object.assign({
                first: true,
                last: true
            }, option);
            var timer = null;
            var t_start = 0;
            return function () {
                var _this = this,
                    args = arguments,
                    t_cur = +new Date();
                //先清理上一次的调用触发（上一次调用触发事件不执行）
                clearTimeout(timer);
                //首次触发
                if (!option.first && t_start === 0) {
                    //fn.apply(_this, args);
                    t_start = t_cur;
                }
                //如果当前时间-触发时间大于等于的间隔时间（delay），触发一次函数运行函数
                if (t_cur - t_start >= delay) {
                    fn.apply(_this, args);
                    t_start = t_cur;
                }
                //最后一次
                else {
                    timer = setTimeout(() => {
                        option.last && fn.apply(_this, args);
                        t_start = 0;
                    }, delay);
                }
            };
        },

        /**
         * @description 手机类型判断
         * @param type
         * @return {*}
         */
        getBrowserInfo: function (type) {
            let typeObj = {
                android: 'android',
                iphone: 'iphone',
                ipad: 'ipad',
                weixin: 'micromessenger'
            }
            return type ? navigator.userAgent.toLowerCase().indexOf(typeObj[type]) !== -1 : navigator.userAgent.toLowerCase();
        },


        // 保存token和appid和userid
        saveUser: function (params) {
            this.setStorage('appInfo', JSON.stringify(params))
        },

        // 加载css函数
        addLink: function (path, func) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = path;
            var head = document.head;
            var title = document.getElementsByTagName('title')[0];
            // document.head.appendChild(link)
            head.insertBefore(link, title)
            func ? func() : null;
        },

        // 加载js函数
        addScript: function (path, opt) {
            opt = opt? opt : {func: null, isRan: false};
            var v = opt.isRan? '?v=' + Number(Math.random() * 10000) : '';
            var script = '<script type="text/javascript" src=' + path + v+ '></script>';
            
            document.write(script)
            opt.func ? setTimeout(function () {
                opt.func()
            }, 16) : null;
        },

        // addScript: function (path) {
        //     return new Promise((r, s) => {
        //         var script = document.createElement("script"); //创建一个script标签
        //         var s = document.querySelector('#script')
        //         script.type = "text/javascript";
        //         script.src = path + '?v=' + Number(Math.random() * 10000);
        //         s.appendChild(script);
        //         setTimeout(function () {
        //             r();
        //         }, 20);
        //     })
        // },


        // 添加fastclick防止移动端点击事件延迟
        addFastclick: function () {
            // 添加fastclick防止移动端点击事件延迟
            setTimeout(function () {
                if ('addEventListener' in document) {
                    document.addEventListener('DOMContentLoaded', function () {
                        FastClick.attach(document.body);
                    }, false);
                }
            }, 200)
        },
        // 日期
        getTime(time) {
            let dt = new Date();
            if (time) dt = time;
            let h = dt.getHours(),
                min = dt.getMinutes(),
                s = dt.getSeconds();
            let times = h + ':' + min
            return times;
        },

        // 获取滚动条高度
        getScrollTop: function () {
            var scrollTop = 0,
                bodyScrollTop = 0,
                documentScrollTop = 0;
            if (document.body) {
                bodyScrollTop = document.body.scrollTop;
            }
            if (document.documentElement) {
                documentScrollTop = document.documentElement.scrollTop;
            }
            scrollTop = (bodyScrollTop - documentScrollTop > 0) ? bodyScrollTop : documentScrollTop;
            return scrollTop;
        },
        //文档的总高度
        getAllHeight: function () {
            var scrollHeight = 0,
                bodyScrollHeight = 0,
                documentScrollHeight = 0;
            if (document.body) {
                bodyScrollHeight = document.body.scrollHeight;
            }
            if (document.documentElement) {
                documentScrollHeight = document.documentElement.scrollHeight;
            }
            scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
            return scrollHeight;
        },
        // 屏幕高度
        getWindowHeight: function () {
            var windowHeight = 0;
            if (document.compatMode == "CSS1Compat") {
                windowHeight = document.documentElement.clientHeight;
            } else {
                windowHeight = document.body.clientHeight;
            }
            return windowHeight;
        },

        isScrollBottom: function () {
            var that = this;
            return new Promise((r, s) => {
                var scroll = function () {
                    // 距离底部120就返回
                    var a = Math.ceil(that.getScrollTop() + that.getWindowHeight()) + 120;
                    var b = that.getScrollHeight();
                    console.log(a, b)
                    if (a >= b) {
                        r();
                        window.removeEventListener('scroll', scroll);
                    }
                }
                window.addEventListener('scroll', scroll)
            })

        }
    };
    var self;
    window.$echo = new Echo();
    window.$echo.startInit();
})(window)