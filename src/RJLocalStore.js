(function() {
    'use strict';


    function RJLocalStore(RJAppGlobal, $q) {



        var FactoryConstructor = function (config) {
           return;
        };

        FactoryConstructor.prototype = RJAppGlobal.data.sqlStoreFactory;

        return new FactoryConstructor();
    }
   angular.module('rijit.dataService').factory('RJLocalStore', ['RJAppGlobal', '$q', RJLocalStore]);

}());