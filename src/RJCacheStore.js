(function () {
    'use strict';


    function RJCacheStore($q) {

        var delegate = (function () {
// boodman/crockford delegation w/ cornford optimization
                function TMP() {
                    return;
                }

                return function (obj, props) {
                    TMP.prototype = obj;
                    var tmp = new TMP();
                    TMP.prototype = null;
                    if (props) {
                        angular.extend(tmp, props);
                    }
                    return tmp; // Object
                };
            }()),
            when = $q.when;

        var FactoryConstructor = function (masterStore, cachingStore, options) {
            options = options || {};
            return delegate(masterStore, {
                query: function (query, directives) {
                    return masterStore.query(query, directives).then(function(results){
                        results.forEach(function (object) {
                            if (!options.isLoaded || options.isLoaded(object)) {
                                cachingStore.put(object);
                            }
                        });
                        return results;
                    });

                },
                cachedQuery: function (query, directives) {
                    var results = cachingStore.query(query, directives);
                    return results;
                },
                get: function (id, directives) {
                    return when(cachingStore.get(id), function (result) {
                        return result || when(masterStore.get(id, directives), function (result) {
                                if (result) {
                                    cachingStore.put(result);
                                }
                                return result;
                            });
                    });
                },
                add: function (object, directives) {
                    return when(masterStore.add(object, directives), function (result) {
// now put result in cache
                        cachingStore.add(result && typeof result === "object" ? result : object, directives);
                        return result; // the result from the add should be dictated by the masterStore and be unaffected by the cachingStore
                    });
                },
                put: function (object, directives) {
// first remove from the cache, so it is empty until we get a response from the master store

                    return when(masterStore.put(object, directives), function (result) {
// now put result in cache
                        cachingStore.put(result && typeof result === "object" ? result : object, directives);
                        return result; // the result from the put should be dictated by the masterStore and be unaffected by the cachingStore
                    });
                },
                remove: function (id, directives) {
                    return when(masterStore.remove(id, directives), function (result) {
                        return cachingStore.remove(id, directives);
                    });
                },
                evict: function (id) {
                    return cachingStore.remove(id);
                }
            });
        };


        return FactoryConstructor;
    }

    angular.module('rijit.dataService').factory('RJCacheStore', ['$q', RJCacheStore]);

}());