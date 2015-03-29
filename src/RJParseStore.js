(function () {
    'use strict';

    function RJParseStore($q) {

        var ParseStore = function (config) {
            config = config || {};
            this.parseInterface = config.parseInterface || null;
        };

        angular.extend(ParseStore.prototype, {



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
            }


        });

        return ParseStore;

    }

    angular.module('rijit.dataService').factory('RJParseStore', ['$q', RJParseStore]);

}());