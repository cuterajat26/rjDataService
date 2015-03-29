(function () {
    'use strict';

    function RJParseInterface($q,RJParseObjectToJson,RJParseArrayToJson) {

        var ParseInterface = function (config) {
            config = config || {};
            this.PARSE = config.PARSE || null;
            this.collection = config.collection || null;
            this.parseObjectToJson = new RJParseObjectToJson();
            this.parseArrayToJson = new RJParseArrayToJson();
            this.queryStrategyMap = {
                'range': this._addRangeForProperty.bind(this),
                'number': this._addNumberMatchForProperty.bind(this),
                'string': this._addStringSearchForProperty.bind(this),
                'undefined': this._emptyQueryCommands.bind(this)
            };
        };

        angular.extend(ParseInterface.prototype, {


            get: function (id) {
                var query = new this.PARSE.Query(this.collection);
                return this.parseObjectToJson.convert(query.get(id));
            },
            add: function (object, options) {
                var record = new this.collection();
                return this.parseObjectToJson.convert(record.save(object));
            },


            put: function (object, options) {
                var record = new this.collection();
                record.id = object.id;
                return this.parseObjectToJson.convert(record.save(object));
            },


            remove: function (id) {
                var record = new this.collection();
                record.id = id;
                return this.parseObjectToJson.convert(record.destroy());
            },
            currentUser:function(){
                var currentUser = this.PARSE.User.current();
                return currentUser?currentUser.toJSON():undefined;
            },
            fetchCurrentUser:function(){
                var currentUser = this.PARSE.User.current();
                    return currentUser.fetch();
            },
            logIn:function(username,password){
               return this.parseObjectToJson.convert(this.PARSE.User.logIn(username,password));
            },
            signUp:function(userObj){
              var user = new this.PARSE.User();
              return this.parseObjectToJson.convert(user.signUp(userObj));
            },
            _addSortingOptions: function (options, parseQuery) {
                if (options && options.sort && options.sort instanceof Array) {
                    angular.forEach(options.sort, function (sortOption) {
                        var order = sortOption.descending ? "descending" : "ascending";
                        parseQuery[order](sortOption.attribute);
                    });
                }
            },


            _addPaginationOptions: function (options, parseQuery) {
                var start = options.start || 0,
                    limit = options.limit || options.count || undefined;

                parseQuery.skip(start);

                if (limit) {
                    parseQuery.limit(limit);
                }
            },


            _addRangeForProperty: function (parseQuery, key, value) {
                parseQuery.greaterThan(key, value[0]);
                parseQuery.lessThan(key, value[1]);
            },


            _addStringSearchForProperty: function (parseQuery, key, value) {

                var searchString = (/\*$/).test(value);
                value = searchString ? value.replace(/\*+$/, ""):value;
                return searchString ? parseQuery.startsWith(key, value) : parseQuery.equalTo(key, value);
            },


            _addNumberMatchForProperty: function (parseQuery, key, value) {
                parseQuery.equalTo(key, value);
            },


            _emptyQueryCommands: function (parseQuery, key, value) {
                return;
            },


            _getPropertyType: function (value) {
                var propertyType;//let it be undefined
                propertyType = (value instanceof Array && value.length === 2) ? "range" : undefined;
                propertyType = (typeof value === "number") ? 'number' : propertyType;
                propertyType = (typeof value === "string") ? 'string' : propertyType;
                return String(propertyType);
            },


            _addQueryCommands: function (query, parseQuery) {
                var self = this;
                angular.forEach(query, function (value, key) {
                    var propertyType = self._getPropertyType(value);
                    var strategyFunc = self.queryStrategyMap[propertyType];
                    strategyFunc(parseQuery, key, value);
                });
            },


            _isEmptyQuery: function (query) {
                return Object.keys(query).length === 0;
            },


            _queryWithFilters: function (parseQuery, query) {
                this._addQueryCommands(query, parseQuery);
                return this.parseArrayToJson.convert(parseQuery.find());
            },

            _queryWithoutFilters: function (parseQuery) {
                return this.parseArrayToJson.convert(parseQuery.find());
            },


            query: function (filters, options) {
                options = options || {};

                var parseQuery = new this.PARSE.Query(this.collection);

                this._addSortingOptions(options, parseQuery);
                this._addPaginationOptions(options, parseQuery);

                return this._isEmptyQuery(filters) ? this._queryWithoutFilters(parseQuery) : this._queryWithFilters(parseQuery, filters);
            }


        });

        return ParseInterface;
    }

    angular.module('rijit.dataService').factory('RJParseInterface', ['$q','RJParseObjectToJson','RJParseArrayToJson', RJParseInterface]);

}());