(function () {
    'use strict';

    function RJIndexedDBStore($q,RJShimIndexedDB) {

        var IndexedDbStore = function (config) {
            config = config || {};
            this.rjIndexedDB = config.rjIndexedDB;
            this.table = config.table;
            this.idProperty = "localId";
        };

        angular.extend(IndexedDbStore.prototype, {

            _getObjectStore: function (mode) {
                if (this.rjIndexedDB.getDB().objectStoreNames.contains(this.table)) {
                    return this.rjIndexedDB.getDB().transaction([this.table], mode).objectStore(this.table);
                }

                return null;
            },

            get: function (id) {
                id = (id === undefined)?"":id;
                var def = $q.defer(),self = this;
                var objectStore = this._getObjectStore("readonly");
                var request = objectStore.get(id);

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };

                request.onsuccess = function (event) {
                    var idObj = {};
                    idObj[self.idProperty] = id;
                    def.resolve(angular.extend(event.target.result, idObj));

                };

                return def.promise;
            },
            getIdentity: function (object) {
                return object[this.idProperty];
            },

            add: function (object, options) {
                options = options || {};
                if (options[this.idProperty] !== undefined && options[this.idProperty] !== null ) {
                    return this.put(object, options);
                }

                var def = new $q.defer();
                var self = this;

                var request = this._getObjectStore("readwrite").add(object);
                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };
                request.onsuccess = function (event) {
                    var result = {};
                    result[self.idProperty] = event.target.result;
                    def.resolve(angular.extend(object, result));
                    // self.notify(lang.mixin(data,{id:event.target.result}));
                };
                //  alert("Name for SSN 444-44-4444 is " + request.result.name);
                return def.promise;

            },


            put: function (object, options) {
                options = options || {};
                if (options[this.idProperty] === undefined || options[this.idProperty] === null) {
                    return this.add(object, options);
                }
                var def = new $q.defer();
                object = object || {};
                if (object[this.idProperty] === undefined || object[this.idProperty] === null) {
                    object[this.idProperty] = null;
                }

                var objectStore = this._getObjectStore("readwrite");

                var request = objectStore.get(object[this.idProperty]);
                var self = this;
                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };
                request.onsuccess = function (event) {
                    var newData = request.result || {};
                    angular.extend(newData, object);
                    var requestUpdate = null;

                    requestUpdate = objectStore.put(newData);

                    requestUpdate.onerror = function (event) {
                        def.reject(event.target.error.message);
                    };
                    requestUpdate.onsuccess = function (event) {
                        def.resolve(event.target.result);
                        if (typeof self.notify === "function") {
                            self.notify(newData, event.target.result);
                        }
                    };

                };
                return def.promise;

            },


            remove: function (id) {
                var def = new $q.defer();
                var self = this;

                var objectStore = this._getObjectStore("readwrite");

                var request = objectStore['delete'](id);

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };

                request.onsuccess = function (event) {
                    def.resolve(event.target.result);
                    if (typeof self.notify === "function") {

                        self.notify(undefined, event.target.result);
                    }
                };
                return def.promise;

            },


            query: function (query, options) {

                options = options || {};
                var start = options.start || 0;
                var limit = options.limit || options.count || undefined;
                var index = 0;
                var def = new $q.defer();
                var order = "next";
                if (options && options.sort && options.sort[0] && options.sort[0].descending === true) {
                    order = "prev";
                }
                var list = [];
                var self = this;
                var objectStore = null;
                var idbkeyrange;
                if (Object.keys(query).length === 0) {
                    objectStore = this._getObjectStore("readonly");
                } else {
                    var key = Object.keys(query)[0];
                    try {
                        objectStore = this._getObjectStore("readonly").index(key);
                    } catch (e) {
                        return null;
                    }
                    if (query[key] instanceof Array && query[key].length === 2) {
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.bound(query[key][0], query[key][1]);
                    } else if(/\*$/.test(query[key])){
                        var searchRegexStr = query[key].toString();
                        // 			var searchText = searchRegexStr.slice(0,searchRegexStr.length-1);
                        var searchText = searchRegexStr.replace(/\*$/, function (str) {
                            return "";
                        });
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.bound(searchText, searchText + '\uffff');
                    }else{
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.only(query[key]);

                    }

                }
                var request = objectStore.openCursor(idbkeyrange, order);
                request.onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {

                        if (index === start) {
                            if (list.length === limit) {
                                def.resolve(list);
                                return;
                            }
                            var result = {};
                            result[self.idProperty] = cursor.primaryKey;
                            list.push(angular.extend(cursor.value, result));

                            cursor['continue']();
                        } else {

                            try {
                                cursor.advance(start - index);
                            } catch (e) {
                                console.error(e);
                            }

                            index = start;
                        }

                    }
                    else {
                        // params.callback(list);

                        def.resolve(list);
                    }
                };

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };


                return def.promise;
            }


        });

        return IndexedDbStore;

    }

    angular.module('rijit.dataService').factory('RJIndexedDBStore', ['$q', 'RJShimIndexedDB',RJIndexedDBStore]);

}());