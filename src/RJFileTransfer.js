(function () {
    'use strict';


    function RJFileTransfer($q) {

        var FactoryConstructor = function (config) {
            this.fileTransferObject = new FileTransfer();
        };

        angular.extend(FactoryConstructor.prototype, {

            upload: function (fileUrl, targetUrl, options) {
                var def = $q.defer(),responseObj;
                this.fileTransferObject.upload(fileUrl, encodeURI(targetUrl),
                    function (r) {
                        try{
                            responseObj = JSON.parse(r.response);
                            def.resolve(responseObj);
                        }catch(e){
                            def.reject(e);
                        }
                    }, function (error) {
                        def.reject(error);
                    }, this._getFileUploadOptions(options));
                return def.promise;
            },
            _getFileUploadOptions:function(optionsObj){
                var options = new FileUploadOptions();
                angular.extend(options,optionsObj);
                return options;
            }

        });

        return FactoryConstructor;
    }

    angular.module('rijit.dataService').factory('RJFileTransfer', ['$q', RJFileTransfer]);

}());