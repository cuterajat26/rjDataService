(function () {
    'use strict';

    function RJIndexedDB($q,RJShimIndexedDB) {

        var MyIndexedDB = function (name) {
            this.name = name;
            this.DB_CONFIG_NAME = "RJDB-"+name+"-config";
            this.db = null;
            this.localStorage = window.localStorage;
        };

        angular.extend(MyIndexedDB.prototype, {


            getDB: function () {
                return this.db;
            },
            createTable:function(name,schema){
                var def = $q.defer();

                if(this._isNewTable(name) || this._isUpdatedSchema(name,schema)){
                    this._registerTableSchema(name,schema);
                    this._bumpVersion();
                    this.openDB().then(function(rjDB){
                        def.resolve(rjDB);
                    },function(error){
                        def.reject(error);
                    });
                }else{
                    def.resolve(this);
                }
                return def.promise;
            },
            openDB:function(){
                var def = $q.defer();
                console.log('db is ',RJShimIndexedDB.indexedDB);
                var request = RJShimIndexedDB.indexedDB.open(this.name,this._getCurrentDbVersion());
                request.onerror = function(error){
                    def.reject(error);
                };
                request.onsuccess = angular.bind(this,function(event){
                    this.db = this._getDbFromEvent(event);
                    def.resolve(this);
                });
                request.onupgradeneeded = angular.bind(this,function(event){
                    this.db = this._getDbFromEvent(event);
                    this._createStores(event);
                    def.resolve(this);
                });
                return def.promise;
            },
            _getDbFromEvent:function(event){
                var target = event.currentTarget || event.target;
                return target.result;
            },
            _createStores: function(event){
                var tables = this._getDBTables();
                angular.forEach(tables,angular.bind(this,function(value, key){
                    this._createStoreFromContract(event,key,value);
                }));
            },
            _createStoreFromContract: function(event,table,contract){
                var sca_label = table;
                var objStore = null;
                if(this.db.objectStoreNames.contains(sca_label)){
                    objStore = (event.currentTarget||event.target).transaction.objectStore(sca_label);
                    this._processProperties(objStore,contract);
                    return;
                }
                //else
                var keyPath = contract.keyPath || 'id';
                objStore = this.db.createObjectStore(sca_label, { keyPath : keyPath });

            },
            _processProperties: function(objStore,contract){
                var i,indeces = contract.indeces || [],property;
                for(i =  0 ; i < indeces.length; i++){
                    property = indeces[i];
                    if(!objStore.indexNames.contains(property.property_name)){
                        objStore.createIndex(property.property_name, property.property_name, { unique: (property['unique'] === true) });
                    }
                }
            },

            _isNewTable:function(name){
              var tables = this._getDBTables();
                return !tables[name];
            },
            _isUpdatedSchema:function(name,schema){
                var tables = this._getDBTables();
                return JSON.stringify(tables[name]) !== JSON.stringify(schema || {});
            },
            _getDBTables: function () {
                var config = this._getDBConfig();
                return config.tables || {};
            },
            _getDBConfig: function () {
                var configJSON = this.localStorage.getItem(this.DB_CONFIG_NAME),config;

                try{
                    config =   JSON.parse(configJSON);
                }catch(e){
                   config = {};
                }
                config = config ||{};
                return config;
            },
            _setDBConfig: function (config) {
                this.localStorage.setItem(this.DB_CONFIG_NAME, JSON.stringify(config));
            },
            _registerTableSchema:function(name,schema){
                var config = this._getDBConfig();
                var tables = this._getDBTables();
                tables[name] = schema;
                config.tables = tables;

                this._setDBConfig(config);
            },
            _getCurrentDbVersion:function(){
                var config = this._getDBConfig();
                return config.version || 1;
            },
            _bumpVersion:function(){
                var config = this._getDBConfig();
                var currentVersion = this._getCurrentDbVersion();
                config.version = currentVersion + 1;
                this._setDBConfig(config);
            }


        });

        return MyIndexedDB;

    }

    angular.module('rijit.dataService').factory('RJIndexedDB', ['$q','RJShimIndexedDB', RJIndexedDB]);

}());