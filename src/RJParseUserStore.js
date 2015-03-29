(function () {
    'use strict';

    function RJParseUserStore($q) {

        var ParseUserStore = function (config) {
            config = config || {};
            this.parseInterface = config.parseInterface || null;
            this.cacheStore = config.cacheStore || null;
        };

        angular.extend(ParseUserStore.prototype, {


            get: function (id) {
                return this.parseInterface.get(id);
            },


            add: function (object, options) {
                return this.parseInterface.add(object, options);

            },


            put: function (object, options) {
                return this.parseInterface.put(object, options);

            },


            remove: function (id) {
                return this.parseInterface.remove(id);

            },


            query: function (filters, options) {
                return this.parseInterface.query(filters, options);

            },
            signUp:function(user){
                return this.parseInterface.signUp(user);
            },
            fetchCurrentUser:function(){
                return this.parseInterface.fetchCurrentUser();
            },

            login:function(username,password){
                return this.parseInterface.logIn(username,password);
            },
            currentUser:function(){
                return this.parseInterface.currentUser();
            }


        });

        return ParseUserStore;

    }

    angular.module('rijit.dataService').factory('RJParseUserStore', ['$q', RJParseUserStore]);

}());