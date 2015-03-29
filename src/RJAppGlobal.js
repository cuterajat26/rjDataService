(function () {
    'use strict';

    angular.module('rijit.dataService').factory('RJAppGlobal', function () {

        return {
            data:{
                application_id : "parse_app_id",
                api_key : "parse_api_key",
                file_api_key: "parse_file_api_key",
                fileUploadPath : "https://api.parse.com/1/files/",
                dbName :'myapp'
        }};



    });

})();