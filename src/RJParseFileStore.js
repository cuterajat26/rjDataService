(function() {
    'use strict';


    function RJParseFileStore($q,RJParse) {

        var FactoryConstructor = function (config) {
            return;
        };

        angular.extend(FactoryConstructor.prototype, {

            add: function (obj) {
                var file = new RJParse.File(obj.name || "image.jpeg", { base64: obj.data }),
                    def = $q.defer();

                 file.save().then(function(file){
                     def.resolve(file);
                 },function(err){
                     return $q.reject(err);
                 });
                return def.promise;
            }

        });

        return FactoryConstructor;
    }
   angular.module('rijit.dataService').factory('RJParseFileStore', ['$q','RJParse', RJParseFileStore]);

}());