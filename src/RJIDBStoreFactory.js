(function() {
    'use strict';


    function RJIDBStoreFactory(RJAppGlobal, RJSQLSchemaApi ,RJIndexedDBStore,$q) {



        var FactoryConstructor = function (config) {
            this.rjIndexedDb = RJAppGlobal.data.db;
        };

        angular.extend(FactoryConstructor.prototype, {

            getStore: function (table) {
                var def = $q.defer();
                this.rjIndexedDb.createTable(table,RJSQLSchemaApi.get(table)).then(function(rjDB){
                    def.resolve(new RJIndexedDBStore({
                        rjIndexedDB:rjDB,
                        table:table
                    }));
                },function(err){
                    def.reject(err);
                });
                return def.promise;
            }

        });

        return (new FactoryConstructor());
    }
    angular.module('rijit.dataService').factory('RJIDBStoreFactory', ['RJAppGlobal','RJSQLSchemaApi' ,'RJIndexedDBStore','$q' ,RJIDBStoreFactory]);

}());