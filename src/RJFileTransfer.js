//NOTE:- Dependency -  cordova plugin add org.apache.cordova.file-transfer

(function () {
    'use strict';


    function RJFileTransfer($q, $cordovaFileTransfer) {

        var FactoryConstructor = function (config) {
        };

        angular.extend(FactoryConstructor.prototype, {

            upload: function (fileUrl, targetUrl, options) {
                var def = $q.defer(),responseObj;
                $cordovaFileTransfer.upload( encodeURI(targetUrl),fileUrl,this._getFileUploadOptions(options)).then(
                    function (r) {
                        try{
                            responseObj = JSON.parse(r.response);
                            def.resolve(responseObj);
                        }catch(e){
                            def.reject(e);
                        }
                    }, function (error) {
                        def.reject(error);
                    });
                return def.promise;
            },
            _getFileUploadOptions:function(optionsObj){
                var options = {};
                angular.extend(options,optionsObj);
                return options;
            }

        });

        return FactoryConstructor;
    }

    angular.module('rijit.dataService').factory('RJFileTransfer', ['$q','$cordovaFileTransfer', RJFileTransfer]);

}());