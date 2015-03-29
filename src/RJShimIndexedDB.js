(function () {
    'use strict';

    function RJShimIndexedDB() {

        /*NOTE:To use this you must include https://github.com/axemclion/IndexedDBShim in your
        * index.html and overwrite the _useShim method to modify window._indexedDb,window._IDBDatabase,etc
        * */

         var poorIndexedDbSupport =  window.navigator.userAgent.indexOf("iPhone OS") !== -1;
        if(poorIndexedDbSupport && window.shimIndexedDB) {
            window.shimIndexedDB.__useShim();
        }

        var shimIndexedDB = {
            indexedDB: window._indexedDB || window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
            IDBDatabase: window._IDBDatabase || window.IDBDatabase,
            IDBTransaction: window._IDBTransaction || window.IDBTransaction,
            IDBCursor: window._IDBCursor || window.IDBCursor,
            IDBKeyRange: window._IDBKeyRange || window.IDBKeyRange
        };
        return shimIndexedDB;

    }

    angular.module('rijit.dataService').factory('RJShimIndexedDB', [RJShimIndexedDB]);

}());