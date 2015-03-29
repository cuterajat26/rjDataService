(function () {
    'use strict';

    function RJParseStoreFactory(RJParse,RJParseStore,RJParseUserStore,RJParseInterface) {

        return {
            getParseStore:function(collectionName){
               var collection =  RJParse.Object.extend(collectionName || "undefined");
                var parseInterface =  new RJParseInterface({
                    PARSE: RJParse,
                    collection: collection
                });

               return new RJParseStore({
                   parseInterface:parseInterface
               });
            },

            getParseUserStore:function(){
                var collection =  RJParse.User;
                var parseInterface =  new RJParseInterface({
                    PARSE: RJParse,
                    collection: collection
                });
                return new RJParseUserStore({
                    parseInterface:parseInterface

                });
            }
        };
    }

    angular.module('rijit.dataService').factory('RJParseStoreFactory', ['RJParse','RJParseStore','RJParseUserStore','RJParseInterface', RJParseStoreFactory]);

}());