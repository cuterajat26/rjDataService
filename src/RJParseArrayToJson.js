(function () {
    'use strict';

    function RJParseArrayToJSON($q) {


        var ParseArrayToJSON = function () {
            return;
        };
        angular.extend(ParseArrayToJSON.prototype, {
            convert: function (def) {
                var localDef = $q.defer();
                var self = this;
                def.then(function (object) {
                    var result =  (object instanceof Array) ? self._convertToJSONArray(object):object;
                    localDef.resolve(result);
                },function(err){
                    localDef.reject(err);
                });
                return localDef.promise;

            },
            _convertToJSONArray:function(object){
                var array = [];
                angular.forEach(object,function(value){
                    var convertedValue = typeof value.toJSON === "function" ? value.toJSON():value;
                    array.push(convertedValue);
                });
                return array;
            }
        });

        return ParseArrayToJSON;
    }

    angular.module('rijit.dataService').factory('RJParseArrayToJson', ['$q', RJParseArrayToJSON]);

}());