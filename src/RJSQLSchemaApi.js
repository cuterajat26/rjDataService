(function () {
    'use strict';


    function RJSQLSchemaApi() {

        var SchemaApi = function (config) {

            this.schemas = {
                Chat: {
                    localId:{},
                    objectId: {},
                    from_user:{},
                    to_user:{},
                    timestamp: {},
                    status: {},
                    message: {
                        indexed: false
                    }
                },
                User:{
                    localId:{},
                    objectId:{},
                    vendor:{}
                },
                Category:{
                    objectId:{},
                    name:{}
                },
                Image : {
                   user:{},
                    objectId:{},
                    localId:{}
                }
            };
        };

        angular.extend(SchemaApi.prototype, {

            getAll:function(){
                return this.schemas;
            },
            registerSchemas:function (schemas){
                this.schemas = schemas || {};
            },
            get: function (tableName) {
                return this.schemas[tableName] || {};
            }

        });

        return new SchemaApi();
    }

    angular.module('rijit.dataService').factory('RJSQLSchemaApi', [RJSQLSchemaApi]);

}());