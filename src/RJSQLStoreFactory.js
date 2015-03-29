(function () {
    'use strict';

    function RJSQLStoreFactory() {


        var SQLStoreFactory = function (config) {
            this.RJWebSQLStore = config.RJWebSQLStore;
            this.localStorage = window.localStorage;
            this.dbName = config.dbName || "defaultDBName";
            this.DB_CONFIG_NAME = "RJSQLDB-"+this.dbName+"-config";
            this.stores = config.schemas || {};
            this.updateStoresConfig(this.stores);
            this.dbVersion = this._getCurrentDbVersion();
            this.db = null;
        };

        angular.extend(SQLStoreFactory.prototype,
         {
            getStore:function(storeName,idProperty){

                var store = new this.RJWebSQLStore({
                    dbConfig: this._getDBConfig(),
                    storeName: storeName,
                    dbName:this.dbName,
                    idProperty : idProperty

                });
                return store;
            },
            _getDBConfig:function(){
              var dbConfig = {
                  stores:this.stores,
                  version: this.dbVersion
              };
                return dbConfig;
            },
             updateStoresConfig:function(newStores){
                 if(this._isUpdatedSchemas(newStores)){
                     this._bumpedVersion();
                     this.updateStores();
                 }
             },
             _getCurrentDbVersion:function(){
                 var config = this._getStoredDBConfig();
                 return config.version || 1;
             },
             _bumpedVersion:function(){
                 var config = this._getStoredDBConfig();
                 var currentVersion = this._getCurrentDbVersion();
                 config.version = currentVersion + 1;
                 this._setStoredDBConfig(config);
                 return config.version;
             },
             _isUpdatedSchemas:function(newStores){
                 var stores = this._getStoredDBStores();
                 return JSON.stringify(stores) !== JSON.stringify(newStores || {});
             },
             _getStoredDBStores: function () {
                 var config = this._getStoredDBConfig();
                 return config.stores || {};
             },
             _getStoredDBConfig: function () {
                 var configJSON = this.localStorage.getItem(this.DB_CONFIG_NAME),config;

                 try{
                     config =   JSON.parse(configJSON);
                 }catch(e){
                     config = {};
                 }
                 config = config || {};
                 return config;
             },
             _setStoredDBConfig: function (config) {
                 this.localStorage.setItem(this.DB_CONFIG_NAME, JSON.stringify(config));
             },
             updateStores:function(){
                 var config = this._getStoredDBConfig();
                 config.stores = this.stores;
                 this._setStoredDBConfig(config);
             }
        });

        return  SQLStoreFactory;
    }

    angular.module('rijit.dataService').factory('RJSQLStoreFactory', [ RJSQLStoreFactory]);

}());