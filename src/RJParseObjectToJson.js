(function () {
    'use strict';

    function RJParseObjectToJSON($q) {


        var ParseObjectToJSON = function () {
            return;
        };
        angular.extend(ParseObjectToJSON.prototype, {
            convert: function (def) {
                var localDef = $q.defer();
                def.then(function (object) {
                    var result = typeof object.toJSON === "function" ? object.toJSON():object;
                    localDef.resolve(result);
                },function(err){
                    localDef.reject(err);
                });
                return localDef.promise;
            }
        });

        return ParseObjectToJSON;
    }

    angular.module('rijit.dataService').factory('RJParseObjectToJson', ['$q', RJParseObjectToJSON]);

}());