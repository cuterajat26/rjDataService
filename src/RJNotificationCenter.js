(function() {
    'use strict';


    function RJNotificationCenter($http, $q , RJEvented) {

        var FactoryConstructor = function (config) {
            return;
        };

        angular.extend(FactoryConstructor.prototype, RJEvented);


        return new FactoryConstructor();
    }
   angular.module('rijit.dataService').factory('RJNotificationCenter', ['$http', '$q','RJEvented', RJNotificationCenter]);

}());