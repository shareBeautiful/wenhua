var that;
var keyword = $echo.getParams('keyword'); // 关键字
var dirType = $echo.getParams('type'); // 文件夹类型
var key = $echo.getParams('key'); // 唯一key
var idx = $echo.getParams('idx'); // 当前文件位置id 只显示某一部分
var posId = location.hash.replace('#', ''); // 当前hash滚动的目录位置
var memory, tit, file, audioType;
var $elLoad = document.querySelector('#loading');
setTimeout(function () {
    $elLoad.style.visibility = "visible"
}, 2000)

if (keyword) {
    file = keyword
    var pro = new Promise((r, s) => {
        if (key === 'fxmc') {
            tit = '佛学名词';
            dirType = dirType + '/mingci';
            r();
        } else if (key === 'fxmc2') {
            tit = '佛学名词2';
            dirType = dirType + '/mingci2';
            r();
        } else if (key === 'czga') {
            tit = '禅宗公案';
            dirType = dirType + '/gongan';
            r();
        } else if (key === 'fxcs') {
            tit = '佛学常识';
            dirType = dirType + '/changshi';
            r();
        } else if (key === 'yxsz') {
            dirType = 'rulaizang/sub';
            key = keyword;
            $echo.getJson('./data/一心三藏.json').then(res => {
                res.forEach((item) => {
                    if (keyword === item.key) {
                        memory = true // 记忆功能
                        file = item.title;
                        tit = item.title;
                        r();
                    }
                })
            })
        }
    })
    pro.then(() => {
        getContent();
    })
} else {
    getData();
}

// 首页进入 获取菜单
function getData() {
    new Promise((r, s) => {
        var menuList = $echo.getStorage('menuData');
        if (menuList) {
            r(menuList);
        } else {
            $echo.getJson('./data/menu.json').then(res => {
                r(res);
            })
        }
    }).then((res) => {
        $echo.setStorage('menuData', res);
        res.forEach(function (itemA) {
            if (itemA.type === dirType) {
                itemA.list.forEach(function (itemB) {
                    if (itemB.key == key) {
                        memory = itemA.memory; // 记忆功能
                        tit = itemB.tit;
                        audioType = itemB.audioType; // 获取音频类型 // 喜马拉雅过滤
                        file = tit;
                    }
                })
            }
        })
        getContent();
    })

}

function getContent() {
    var type = dirType + '_' + key;
    // 暂时不需要存直接请求
    // if (keyword) type = type + '_' + keyword;  // 如果是关键名词加上他的关键词
    // if (dirType === 'ximalaya') type = type + '_' + idx;// 如果是喜马拉雅过来的加上idx
    var url = './data/' + dirType + '/' + file + '.json';
    new Promise((r, s) => {
        $echo.checkVersion(type);
        // 如果是有关键名词过来，或者是 喜马拉雅过来则不需要缓存
        if (keyword || dirType === 'ximalaya') {
            requests();
            return false;
        }
        INDEXDB.getItem(type, (res) => {
            if (res) {
                res.from = 'indexdb'
                r(res)
            } else {
                requests();
            }
        });

        function requests() {
            $echo.getJson(url).then(res => {
                if (res.length === 0) {
                    alert('当前网页维护中...，请点击确定关闭');
                    window.close();
                    return false;
                }
                var data = {
                    list: res,
                    from: 'request'
                }
                r(data)
            })
        }
    }).then(res => {

        var list = res.list;
        var from = res.from;
        // 判断是否有位置id，只显示某个部分喜马拉雅
        if (dirType === 'ximalaya') {
            dataList = list.splice(idx, 1);
            tit = dataList[0].title;
        } else {
            dataList = list
        }

        if (keyword) {
            tit = dataList[0].title;
        }
        document.title = tit; // 标题


        // vue 渲染
        new Vue({
            el: '#app',
            data: function () {
                return {
                    title: tit,
                    list: [], // 所有数据列表
                    menuList: [], // 菜单列表
                    len: dataList.length, // 数据长度
                    colors: ['success', 'info', 'warning', 'danger'],
                    showMenu: false, // 切换显示菜单
                    allTotal: 0, // 总字数
                    font: [18, 20, 22, 24, 26, 28],
                    currFont: 21,
                    // footMenu: [{n:'目录'},{n:'进度'},{n:'设置'},{n:'夜间'}],
                    footMenu: [{
                        n: '设置'
                    }],

                    book: [], // 书签
                    webUrl: 'https://www.liaotuo.com',
                    dirType: dirType,
                    themeL: [{ // 主题
                        n: '阅读',
                        id: 1
                    }, {
                        n: '古风',
                        id: 2
                    }, {
                        n: '白天',
                        id: 3
                    }, {
                        n: '夜晚',
                        id: 4
                    }],
                    theme: 1, // 1默认，1，bg1,bg2
                    process: 0, // 当前阅读进度
                    subProcess: 0, // 当前章节阅读进度
                    localInfo: {}, // 当前页面存在本地的信息
                    word: '', // 搜索目录关键字
                    isDark: false, // 默认系统主题
                    isPage: false, // 默认翻页
                    isOnPage: false, // 是否分页加载
                    isReverse: false, // 默认目录排序
                    isAuto: false, // 默认不自动翻页
                    autoTime: null, // 自动时间
                    step: 5, // 自动调步
                    currTime: 100, // 当前选择时间
                    scrollTime: null, // 滚动日期
                    showRest: false, // 显示重新设置
                    currItem: '', // 当前标题名称
                    currIdx: '', // 当前索引
                    showAudio: false, // 是否显示音频
                    audioSrc: '', // 视频连接地址
                    showOpt: false, // 是否显示设置
                    dbTime: null, // 双击单机时间计时器
                    startTime: null, // 启动自动滚动计时器
                    processtime: null, // 计算阅读百分比计时器
                    touchTime: null, // 触摸设置的计时器
                    memoryId: 0, // 当前需要显示的index章节, 为-1不需要设置按需加载
                    memoryP: 0, // 当前需要记录的 位置比例
                    docHeight: 0, // 文档总高度
                    idHeightL: [], // 每个id章节的高度列表
                    idOffTopL: [], // 每个id章节距离顶部的距离列表
                    pageAll: 0, // 总页码
                    pageCurr: 0 // 当前页面

                }
            },
            computed: {


            },
            methods: {
                // 
                saveInfo: function (k, v) {
                    this.localInfo[k] = v;
                    $echo.setStorage('localInfo_' + type, this.localInfo);
                },
                getInfo: function (k) {
                    var d = $echo.getStorage('localInfo_' + type)
                    d = d ? d : {};
                    return k ? d[k] : d;
                },

                // 裁剪标题
                subTit: function (title) {
                    if (title.length > 15) {
                        return title.slice(0, 15)
                    } else {
                        return title
                    }
                },

                // 计算总数
                total: function (str, n) {
                    if (n) {
                        if (n >= 1000 && n < 10000) {
                            n = n / 1000 + 'k'
                        } else if (n >= 10000) {
                            n = n / 10000 + 'w'
                        }
                        return n;
                    }
                    var re = /[\u4e00-\u9fa5]/mg;
                    var arr = str.match(re);
                    var num = arr ? arr.length : 0;
                    var s = num;
                    if (num >= 1000 && num < 10000) {
                        s = num / 1000 + 'k'
                    } else if (num >= 10000) {
                        s = num / 10000 + 'w'
                    }
                    return {
                        str: s,
                        num: num
                    }
                },
                // 显示菜单切换
                clickShowMenu: function (id, item) {
                    this.hideReadOpt();
                    this.showMenu = true;
                    this.setCurr(id, item)
                },

                // 向左滑动隐藏菜单
                clickHideMenu: function () {
                    this.showMenu = false
                },

                // 清空设置
                reset: function (s) {
                    var is = window.confirm('是否清空设置？')
                    if (is) {
                        if (s === 's') {
                            localStorage.removeItem('localInfo_' + type)
                            sessionStorage.clear();
                        } else if (s === 'c') {
                            INDEXDB.deleteItem(type);
                        }
                    }
                },

                // 搜索目录
                search: function () {
                    this.menuList.forEach((item, id) => {
                        if ((id + 1 + '--' + item.title).indexOf(this.word) > -1) {
                            item.hide = false;
                            // this.$set(item,'hide', false)
                        } else {
                            item.hide = true;
                            // this.$set(item,'hide', true)
                        }
                    })
                },
                // 回车
                enterSearch: function () {
                    var isp = this.word.indexOf('%') > -1;
                    var isg = this.word.indexOf('/') > -1
                    if (isp || isg) {
                        if (isp) {
                            var re = /\d+(\.\d+)?/img
                            var p = this.word.match(re)[0]
                            if (p > 0 && p <= 100) {
                                this.process = (+p).toFixed(3) + '%';
                                var allH = document.documentElement.offsetHeight - this.height // 页面总高度
                                p = p / 100;
                                p = p <= 1 ? p : 1;
                                window.scrollTo(0, parseFloat(p * (allH)));
                            }
                        } else if (isg) {
                            var re = /\d+/img
                            var p = this.word.match(re)[0]
                            if (p >= 1) {
                                window.scrollTo(0, this.height * p);
                            }
                        }
                        this.word = '';
                        this.search();
                        this.memorySave(this.memoryId);
                        event.target.blur();
                        this.clickHideMenu();
                    }
                },

                // 切换排序倒序
                switchOrder: function () {
                    this.menuList.reverse();
                    this.isReverse = !this.isReverse
                },

                // 设置主题
                changeTheme: function (item) {
                    this.theme = item.id
                    $echo.setStorage('theme', this.theme);
                },

                // 设置字体
                setFont: function (size, is) {
                    var s = this.getInfo('size');
                    if (isNaN(s) || s == false) {
                        s = this.currFont;
                    }
                    if (size == '+') {
                        s = (s + 1)
                    } else if (size == '-') {
                        s = (s - 1)
                    } else {
                        s = size;
                    }
                    var dom = document.querySelector('#bodyBox');
                    dom.style.fontSize = s + 'px';
                    this.saveInfo('size', s)
                    // 由于字体改变后页面高度变化，需要延迟重新计算回到当前位置
                    setTimeout(() => {
                        this.$nextTick(() => {
                            if (!is) this.getAllHeight(true); // 太卡，不搞了，由于字体改变需要重新更新高度 
                            // 由于字体改变需要重新获取每一个id的高度
                            this.memoryTo(); // 重新计算
                        })
                        this.currFont = s;
                    }, 30)

                },

                // 添加书签
                addBook: function () {
                    var osTop = this.memorySun()
                    var is = window.confirm('是否加入书签？')
                    if (is) {
                        this.book.push({
                            id: this.memoryId,
                            p: this.memoryP
                        });
                        this.saveInfo('book', this.book)
                    }
                },

                // 删除书签
                delBook: function (idx) {
                    var is = window.confirm('确认删除书签' + idx + 1 + '?')
                    if (is) {
                        this.book.splice(idx, 1);
                        // this.localInfo['book' + type] = this.book;
                        this.saveInfo('book', this.book)
                    }

                },

                // 跳转书签
                toBook: function (item) {
                    if (this.isOnPage) {
                        this.loadUpdate(item.id, '=')
                    }
                    this.currIdx = item.id;
                    this.$nextTick(() => {
                        this.memoryTo(item.id, item.p)
                    })
                },

                // 跳转目录位置
                toPos: function (id, item, time) {
                    if (this.isOnPage) { // 如果是按需加载
                        this.loadUpdate(id, '=')
                        this.setCurr(id, item)
                        // this.setCurrentUrl(id); // 设置当前url位置
                    } else {
                        time = (time == 0 || time) ? time : 120
                        if (id !== '') {
                            if (this.isAuto) this.switchScroll('s'); // 如果自动开启 停止
                            this.setCurrentUrl(id); // 设置当前url位置
                            var el = document.getElementById('id' + id);
                            this.ScrollTop(el.offsetTop, time);
                        }
                        if (item) {
                            setTimeout(() => {
                                if (this.isAuto) this.switchScroll('e'); // 如果自动开启则启动
                                this.setCurr(id, item)
                            }, time + 10)
                        }
                    }
                },

                // 设置当前url
                setCurrentUrl(id) {
                    if (!!(window.history && history.pushState)) {
                        // 支持History API
                        var href = location.href.split('#')[0]
                        history.replaceState(null, null, id == '0' ? href : '#' + id)
                    }
                },

                // 过滤html
                filterHtml: function (html, title) {
                    // if (keyword) {
                    //     if(tit) {
                    //         document.title = tit + '：' + title
                    //     }else {
                    //         document.title = title
                    //     }
                    // }
                    var reg = /\<a.*?href="(.*?)"/img
                    var regKey = /\/.*?\/(.*?)\.html/i
                    var res = html.replace(reg, function (s, $1) {
                        var key;
                        var href;
                        key = regKey.exec($1)
                        if ($1.indexOf('http') !== -1 || $1.indexOf('html') === -1) { // 判断是否是全连接
                            href = 'href="' + $1 + '"';
                        } else if (key && key[1]) { // 跳转本地关键词
                            href = 'href="content.html?type=key&key=fxmc&keyword=' + key[1] + '"';
                        } else {
                            href = 'href="' + that.webUrl + $1 + '"';
                        }
                        return s.replace(/href="(.*?)"/, href)
                    })
                    return res.replace(/<p>　{2}/img, '<p>') // 去掉全角　空格
                },


                // 开启跟随系统主题
                switchDark: function () {
                    this.isDark = !this.isDark;
                    if (this.isDark && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        this.theme = 4;
                    } else {
                        this.theme = localStorage.theme;
                    }
                    localStorage.setItem('isDark', this.isDark)
                },

                // 切换白天和黑夜
                switchTheme: function () {
                    if (this.theme === 4) {
                        this.theme = 1;
                    } else {
                        this.theme = 4;
                    }
                },

                // 开启翻页
                switchPage: function () {
                    this.isPage = !this.isPage;
                    if (this.isAuto) { // 如果自动翻页开启则切换翻页模式
                        this.setAutoTime();
                    }
                },

                // 开启分页
                switchLoad: function () {
                    if (this.isOnPage) {
                        this.isOnPage = false;
                    } else {
                        this.getIdHeight(this.len, true); // 切换分页之前更新id高度
                        this.loadUpdate(this.memoryId, '=')
                        this.isOnPage = true;
                    }
                    $echo.setStorage('isOnPage', this.isOnPage);
                    this.$nextTick(() => {
                        this.memoryTo()
                    })
                },

                // 滚动到...
                ScrollTop: function (number, time) {
                    $('html,body').stop(true).animate({
                        scrollTop: number
                    }, time, 'linear');

                },

                // 设置自动翻页的时间
                setAutoTime: function () {
                    this.stopScroll();
                    localStorage.setItem('currTime', this.currTime);
                    this.autoTime = this.currTime;
                    if (this.isPage) { // 是否翻页还是滚屏
                        this.isAuto = setInterval(() => {
                            --this.autoTime;
                            if (this.autoTime === 0) {
                                this.autoTime = this.currTime
                                this.pageDown(300); // 下一页
                            }
                        }, 1000)
                    } else {
                        var t = Math.pow(this.currTime, 2) * 8;
                        this.pageDown(t);
                        this.isAuto = setInterval(() => {
                            this.pageDown(t)
                        }, t - 10)
                    }
                    // 自动滚屏时候 定时计算百分比
                    this.processtime = setInterval(() => {
                        var id = this.isOnPage ? this.memoryId : this.updateCurrId() // 更新当前计算所在id
                        this.getProcess(id); // 刷星百分比
                    }, 3000)

                },

                // 下一页
                pageDown: function (t) {
                    // 页面当前的总高度，不是所有高度
                    var pageH = this.isOnPage ? document.documentElement.offsetHeight : this.getAllHeight();
                    var h = this.height; // 屏幕可看高度
                    var nowTop = document.documentElement.scrollTop; // 获取当前滚动条位置
                    var height = nowTop + h;
                    if (height <= pageH - 30) {
                        return this.ScrollTop(height, t)
                    } else {
                        // 判断自动滚动到底部关闭
                        if (this.isAuto) {
                            this.stopScroll();
                            this.isAuto = null
                        }

                    }

                },

                // 上一页
                pageUp: function () {
                    var h = this.height; // 屏幕可看高度
                    var nowTop = document.documentElement.scrollTop; // 获取当前滚动条位置
                    var height = nowTop - h;
                    this.ScrollTop(height, 5)
                },

                // 计算页面中每个章节距离顶部的距离用于自动翻页自动计算
                updateCurrId: function (isUpdate) {
                    var len = this.len;
                    if (len <= 1) return 0
                    var arr, top, top1, top2, idx = 0;
                    if (isUpdate) this.idOffTopL = []; // 更新
                    if (this.idOffTopL.length === 0) {
                        for (var i = 0; i < len; i++) {
                            top = document.getElementById('id' + i).offsetTop - (this.height / 2);
                            this.idOffTopL.push(top)
                        }
                    }
                    var nowTop = document.documentElement.scrollTop;
                    arr = this.idOffTopL;
                    for (var n = 0; n < len; n++) {
                        if (n < len - 1) {
                            top1 = arr[n]
                            top2 = arr[n + 1]
                            if (nowTop >= top1 && nowTop < top2) {
                                idx = n;
                                break;
                            }
                        } else {
                            idx = n
                        }
                    }
                    return idx;
                },

                // 开启自动翻页
                switchAuto: function (time) {
                    // this.isPage = !this.isAuto;
                    if (!this.isAuto) {
                        this.isAuto = true;
                        this.setAutoTime()
                        // 监听滚动，是否滚动到底吧就取消自动阅读功能
                        // $echo.isScrollBottom().then(() => {
                        //     this.stopScroll();
                        //     this.isAuto = null
                        // })
                    } else {
                        this.stopScroll();
                        this.isAuto = null
                    }
                },

                // 停止滚动不关闭自动开关
                stopScroll: function () {
                    clearInterval(this.isAuto); // 清除自动计时器
                    clearInterval(this.processtime);
                    $('html').stop(true)
                },

                // 触摸停止滚动，松开继续滚动
                switchScroll: function (s) {
                    if (this.isAuto && !this.isPage) { // 自动滚动开启，不是翻页模式
                        if (s === 's') {
                            clearTimeout(this.startTime)
                            this.stopScroll();
                        }
                        if (s === 'e') {
                            clearTimeout(this.startTime)
                            this.startTime = setTimeout(() => {
                                if (this.isAuto && !this.isPage) {
                                    this.setAutoTime();
                                }
                            }, 1000)
                        }
                    }
                },



                // 获取当前章节的进度 1. 单击显示设置执行，2. 点击菜单执行，3. 触摸松开设置面执行
                getProcess: function (id) {
                    id = (id || id == 0) ? id : this.memoryId;
                    var h = this.height + 10; // 屏幕可看高度 多给10px只是显示不影响计算
                    var scrollTop = parseInt(document.documentElement.scrollTop); // 滚动高度
                    var dH, allH;
                    if (this.isOnPage) {
                        allH = this.getAllHeight();
                        var idH = this.getIdHeight(id); // 获取当前文档距离顶部的高度
                        dH = idH + scrollTop;

                    } else {
                        allH = this.getAllHeight(); // 获取全部高度
                        dH = scrollTop;
                    }

                    this.process = subs(dH, allH, h);

                    // 获取当前章节进度
                    if (id == 0 || id) {
                        var el = document.getElementById('id' + id); // 获取当前章节节点
                        var elTop = parseInt(el.offsetTop); // 当前章节距离顶部高度
                        var height = parseInt(el.offsetHeight); // 当前章节的高度
                        var dH = scrollTop - elTop; // 滚动高度 - 元素距离顶部高度差
                        this.subProcess = subs(dH, height, h);
                        // 计算页面
                        if (this.isOnPage) {
                            this.pageAll = Math.ceil(height / h);
                        } else {
                            this.pageAll = Math.ceil(allH / h);
                        }
                        this.pageCurr = Math.ceil((scrollTop + 10) / h);
                    }

                    // 计算百分比函数
                    function subs(dH, allH, h) {
                        var p = 0;
                        if (dH <= 0) { // 高度差<=0设置为0
                            p = 0;
                        } else if (dH + h >= allH) { // 高度差 + 屏幕高度 >= 元素高度
                            p = 100;
                        } else {
                            p = (dH / (allH - h)) * 100; // 高度差 和 当前元素高度+屏幕高度的比例，主要解决去掉可视底部的值。
                            p = p == 0 ? p : p.toFixed(3);
                        }
                        return p + '%';
                    }

                },

                // 获取整个网页的高度 是否需要更新
                getAllHeight: function (isUpdate) {
                    if (this.isOnPage) {
                        if (this.docHeight == 0 || isUpdate) {
                            this.docHeight = this.getIdHeight(this.len, isUpdate);
                        }
                    } else {
                        // 如果关闭分页 重新计算 否则默认
                        this.docHeight = document.documentElement.offsetHeight;
                    }

                    return this.docHeight
                },

                // 获取各个章节高度 是否需要更新 好性能和时间
                getIdHeight: function (id, isUpdate) {
                    if (this.idHeightL.length === 0 || isUpdate) {
                        this.idHeightL = [];
                        // 这步尽量少执行
                        if (this.isOnPage) {
                            for (var i = 0; i < this.len; i++) {
                                this.idHeightL.push($('#id' + i).height());
                            }
                        } else {
                            for (var i = 0; i < this.len; i++) {
                                this.idHeightL.push(document.querySelector('#id' + i).offsetHeight);
                            }
                        }
                        this.saveInfo('idH', this.idHeightL);
                    }
                    var s = 0;
                    for (var n = 0; n < id; n++) {
                        s += this.idHeightL[n];
                    }
                    return s;
                },

                // 显示阅读设置
                showReadOpt: function (id, item) {
                    clearTimeout(this.dbTime);
                    // 双击菜单和单机菜单定时器
                    if (this.showOpt) {
                        this.showOpt = false;
                    } else {
                        this.dbTime = setTimeout(() => {
                            this.showOpt = true;
                            this.setCurr(id, item);
                            this.memorySave(id);
                        }, 230);
                    }

                },

                // 隐藏阅读设置
                hideReadOpt: function () {
                    clearTimeout(this.dbTime);
                    this.showOpt = false;
                },


                // 重新计算
                touchReadOpt: function () {
                    this.getProcess();
                },

                // 按需加载添加
                loadUpdate: function (id, type) {
                    window.scrollTo(0, 0)
                    if (type === '+') {
                        if (id < this.len - 1) {
                            this.memoryId = id + 1;
                        }
                    } else if (type === '-') {
                        if (id > 0) {
                            this.memoryId = id - 1;
                        }
                    } else if (type === '=') {
                        this.memoryId = id
                    }

                },



                // 跳转记录的位置
                memoryTo: function (id, p) {
                    id = (id || id == 0) ? id : this.memoryId;
                    p = p ? p : this.memoryP;
                    var h = this.height; // 屏幕可看高度
                    var el = document.getElementById('id' + id); // 获取当前章节节点
                    var elTop = el.offsetTop; // 当前章节距离顶部高度
                    var elH = el.offsetHeight - h; // 当前章节高度
                    var toH = elTop + (p * elH); // 需要跳转的距离                 
                    window.scrollTo(0, toH)
                },

                // 计算当前所在章节位置
                memorySun: function (id) {
                    id = (id || id == 0) ? id : this.memoryId;
                    var h = this.height; // 屏幕可看高度
                    var el = document.getElementById('id' + id); // 获取当前章节节点
                    var elTop = el.offsetTop; // 当前章节距离顶部高度
                    var elH = el.offsetHeight; // 当前章节高度
                    var scrollTop = document.documentElement.scrollTop; // 滚动高度
                    var s = scrollTop - elTop;
                    var allHeight = elH - h; // 当前章节的高度
                    // 获取全部进度
                    var p = s / allHeight
                    return p.toFixed(8)
                },

                // 记录当前位置
                memorySave: function (id) {
                    this.memoryId = id;
                    this.memoryP = this.memorySun(id)
                    this.saveInfo('posInfo', id + '#' + this.memoryP)
                },

                // 单击或双击设置当前导航  1. 点击调用，2. 双击调用，3. 点击目录退转调用
                setCurr: function (id, item) {
                    this.currItem = item ? item : this.list[id];
                    this.currIdx = id;
                    this.getProcess(id); // 更新
                    this.memorySave(id); // this.memoryId = id; // 当前钱的id
                },

                // 匹配关键名词 太卡以后做
                filterWord: function () {
                    $echo.getJson('./data/佛学名词.json').then(function (res) {
                        var arrS = [],
                            objK = {},
                            str = '';
                        res.forEach(item => {
                            arrS.push(item.title);
                            objK[item.title] = item.key;
                        })
                        str = arrS.join('|')
                        var re = new RegExp(str, 'gm')
                        that.list.forEach(item => {
                            var arra = []
                            item.html = item.html.replace(re, function (s) {
                                var href = `/content.html?type=key&key=fxmc&keyword=${objK[s]}`
                                var has = arra.includes(s); // 判断是否存在
                                arra.push(s);
                                if (has) {
                                    return s
                                } else {
                                    return `<a href="${href}" target="_blank">${s}</a>`
                                }
                            })
                        })

                    })
                },

                init: function () {
                    // 设置记忆功能
                    if (memory) {
                        this.showRest = true; // 有记忆功能才开启
                        this.$nextTick(() => {
                            this.memoryTo(this.memoryId)
                        })
                        // 自动保存8秒
                        setInterval(() => {
                            if (!this.isOnPage) this.memoryId = this.updateCurrId(); // 获取当前所处的ID位置
                            this.memorySave(this.memoryId)
                        }, 8000);

                    } else {
                        if (posId) {
                            this.$nextTick(() => {
                                this.toPos(posId, false, 1)
                            })
                        }
                    }


                    // 如果分页则设为0后期计算，如果不是直接获取
                    if (this.isOnPage) {
                        // 初始化计所有节点高度,会加大访问压力
                        this.idHeightL = this.getInfo('idH') || [];
                        if (this.idHeightL.lenght > 0) {
                            this.docHeight = this.getAllHeight();
                        } else {
                            this.docHeight = 0;
                        }
                    } else {
                        this.docHeight = document.documentElement.offsetHeight;
                    }


                    this.$nextTick(() => {
                        // 防止点击a标签触发父级的点击事件
                        $("#bodyBox a").click(function () {
                            event.stopPropagation();
                        })
                    })

                    // 喜马拉雅音频
                    if (dirType === 'ximalaya') {
                        // var tit = this.list[0].title;
                        // document.title = tit
                        this.showAudio = audioType; // 显示音频
                        if (audioType === 'mp4') {
                            var src = '/video/' + file + '/' + tit + '.' + audioType;
                            this.audioSrc = src;
                        } else {
                            var src = '/audio/' + file + '/' + tit + '.' + audioType;
                            var audio = playAudio(src);
                        }

                        // audio.loop = true  // 设置循环播放
                    }

                },

            },

            created: function () {
                that = this;
                this.height = window.innerHeight
                if (from === 'request') {
                    dataList.forEach((item, idx) => {
                        var t = this.total(item.html);
                        item.total = t.str;
                        item.html = this.filterHtml(item.html, item.title);
                        item.id = idx;
                        this.menuList.push({
                            "id": item.id,
                            "title": item.title,
                            "total": item.total
                        })
                        this.allTotal += t.num
                    })
                    INDEXDB.putItem(type, {
                        list: dataList,
                        menu: this.menuList,
                        allTotal: this.allTotal
                    }); // 存入indexdb
                } else {
                    this.menuList = res.menu;
                    this.allTotal = res.allTotal;
                }

                this.list = dataList;

                // 获取id 和 位置
                var posInfo = this.getInfo('posInfo');
                if (posInfo) {
                    posInfo = posInfo.split('#')
                    if (posInfo.length === 2) {
                        var memoryId = parseInt(posInfo[0]);
                        this.memoryId = isNaN(memoryId) ? 0 : memoryId;
                        this.memoryP = posInfo[1];
                    }
                }

                // 指定条件 是否按需加载
                var isOnPage = $echo.getStorage('isOnPage');
                if(this.allTotal <=100000) {
                    this.isOnPage = false;
                }else {
                    this.isOnPage = this.len >= 5 ? true : Boolean(eval(isOnPage));
                }
                
                if (this.isOnPage) {
                    this.loadUpdate(this.memoryId, '=');
                }

            },

            mounted: function () {
                this.height = $elLoad.offsetHeight; // 获取屏幕的高度
                $elLoad.style.display = 'none'
                this.localInfo = this.getInfo(); // 获取当前页本地信息
                var size = this.localInfo['size'];
                if (size) this.setFont(size, true);
                var book = this.localInfo['book'];
                this.book = book ? book : [];
                this.isDark = Boolean(eval($echo.getStorage('isDark'))); // 转换布尔值
                this.currTime = $echo.getStorage('currTime') || this.currTime;
                if (this.isDark) { // 是否开启跟随系统
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        this.theme = 4;
                    } else {
                        this.theme = 1;
                    }
                } else {
                    this.theme = localStorage.getItem('theme') || 1;
                }

                this.init(); // 初始设置

            },
        })
    })

}