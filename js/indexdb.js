
 /* // 使用方法
 // 存储数据
 INDEXDB.setItem('data', 'insertData');
 // 取出数据
  INDEXDB.getItem('data', (res) => {
      console.log(res);
  })
  //删除数据
  INDEXDB.deleteItem('data');
 //修改数据
  INDEXDB.putItem('data','newData')
 // 清空数据表
  INDEXDB.clearTable()
*/



//先定义数据库数据
var Salt = {
    name: 'foxue', // 数据库名
    version: 1,        // 版本号
    db: null,          // 
    table: 'foxueTable' // 表名字
};

var INDEXDB = {
    openDB(name, version, table, callback) {
        var request = window.indexedDB.open(name, version);
        request.onerror = function (e) {
            // console.log(e.currentTarget.error.message);
        };
        request.onsuccess = function (e) {
            Salt.db = e.target.result;
            if (callback && (typeof callback === 'function')) {
                callback(Salt.db)
            }
        };
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(table)) {
                db.createObjectStore(table, {
                    keyPath: "id"
                });
            }

        };
    },
    setItem(key, val) {
        INDEXDB.openDB(Salt.name, Salt.version, Salt.table, function () {
            try {
                var addData = [{
                    id: key,
                    value: val
                }]
                var transaction = Salt.db.transaction(Salt.table, 'readwrite');
                var store = transaction.objectStore(Salt.table);
                for (var i = 0; i < addData.length; i++) {
                    store.add(addData[i]);
                }
                INDEXDB.closeDB()
            } catch (error) {
                console.log(error);
            }
        });
    },
    getItem: function (val, back) {
        INDEXDB.openDB(Salt.name, Salt.version, Salt.table, function () {
            var transaction = Salt.db.transaction(Salt.table, 'readwrite');
            var store = transaction.objectStore(Salt.table);
            var request = store.get(val);
            request.onsuccess = function (e) {
                if (back && (typeof back === 'function')) {
                    if (e.target.result) {
                        back(e.target.result.value)
                    } else {
                        back('')
                    }
                    INDEXDB.closeDB()
                }

            }
        })
    },
    putItem(key, value) {
        INDEXDB.openDB(Salt.name, Salt.version, Salt.table, function () {
            var transaction = Salt.db.transaction(Salt.table, 'readwrite');
            var store = transaction.objectStore(Salt.table);
            var request = store.get(key);
            request.onsuccess = function (e) {
                try {
                    var resultData = e.target.result;
                    resultData.value = value;
                    var resultInfo = store.put(resultData);
                    resultInfo.onsuccess = function (e) {
                        if (e.type == 'success') {
                            INDEXDB.closeDB()
                        }
                    }
                } catch (error) {
                    INDEXDB.setItem(key, value)
                }
            };
        })

    },
    deleteItem(key) {
        INDEXDB.openDB(Salt.name, Salt.version, Salt.table, function () {
            var transaction = Salt.db.transaction(Salt.table, 'readwrite');
            var store = transaction.objectStore(Salt.table);
            var result = store.delete(key);
            result.onsuccess = function (e) {
                if (e.type == 'success') {
                    INDEXDB.closeDB()
                }
            }
        })
    },
    clearTable() {
        INDEXDB.openDB(Salt.name, Salt.version, Salt.table, function () {
            var transaction = Salt.db.transaction(Salt.table, 'readwrite');
            var store = transaction.objectStore(Salt.table);
            var result = store.clear();
            result.onsuccess = function (e) {
                if (e.type == 'success') {
                    INDEXDB.closeDB()
                }
            }
        })
    },
    closeDB() {
        //console.log(Salt);
        Salt.db.close();
    },
};
//初始化数据库
INDEXDB.openDB(Salt.name, Salt.version, Salt.table);
