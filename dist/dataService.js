angular.module('rijit.dataService', ['ngResource']);
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
(function () {
    'use strict';


    function RJCacheStore($q) {

        var delegate = (function () {
// boodman/crockford delegation w/ cornford optimization
                function TMP() {
                    return;
                }

                return function (obj, props) {
                    TMP.prototype = obj;
                    var tmp = new TMP();
                    TMP.prototype = null;
                    if (props) {
                        angular.extend(tmp, props);
                    }
                    return tmp; // Object
                };
            }()),
            when = $q.when;

        var FactoryConstructor = function (masterStore, cachingStore, options) {
            options = options || {};
            return delegate(masterStore, {
                query: function (query, directives) {
                    return masterStore.query(query, directives).then(function(results){
                        results.forEach(function (object) {
                            if (!options.isLoaded || options.isLoaded(object)) {
                                cachingStore.put(object);
                            }
                        });
                        return results;
                    });

                },
                cachedQuery: function (query, directives) {
                    var results = cachingStore.query(query, directives);
                    return results;
                },
                get: function (id, directives) {
                    return when(cachingStore.get(id), function (result) {
                        return result || when(masterStore.get(id, directives), function (result) {
                                if (result) {
                                    cachingStore.put(result);
                                }
                                return result;
                            });
                    });
                },
                add: function (object, directives) {
                    return when(masterStore.add(object, directives), function (result) {
// now put result in cache
                        cachingStore.add(result && typeof result === "object" ? result : object, directives);
                        return result; // the result from the add should be dictated by the masterStore and be unaffected by the cachingStore
                    });
                },
                put: function (object, directives) {
// first remove from the cache, so it is empty until we get a response from the master store

                    return when(masterStore.put(object, directives), function (result) {
// now put result in cache
                        cachingStore.put(result && typeof result === "object" ? result : object, directives);
                        return result; // the result from the put should be dictated by the masterStore and be unaffected by the cachingStore
                    });
                },
                remove: function (id, directives) {
                    return when(masterStore.remove(id, directives), function (result) {
                        return cachingStore.remove(id, directives);
                    });
                },
                evict: function (id) {
                    return cachingStore.remove(id);
                }
            });
        };


        return FactoryConstructor;
    }

    angular.module('rijit.dataService').factory('RJCacheStore', ['$q', RJCacheStore]);

}());
(function () {

    function RJChatApi($q,$filter, $timeout,RJEvented) {

        var ChatApi = function (config) {
            this._chatStore = config.chatStore || {};
            this._masterStore = config.masterStore || {};
            this.sender = config.sender || "myId";
            this.receiver = config.receiver || "myId";
            this._chatMap = {};
            this._observableArray = [];
            this.isNewChatAvailable = false;
            this.isNewChatUpdateAvailable = false;
        };

        angular.extend(ChatApi.prototype, RJEvented);
        angular.extend(ChatApi.prototype, {


            sendChat: function (user, message) {
                var chatObject = this._generateChatObject(user, message);
                var promise = this._updateLocalStore(chatObject)
                    .then(angular.bind(this,this._updateObservableArray),this._errBack);


                promise.sync = this._updateStatus(angular.copy(chatObject),'sent')
                    .then(angular.bind(this, this._updateMasterStore), this._errBack)
                    .then(angular.bind(this, this._updateLocalStore), this._errBack)
                    .then(angular.bind(this,this._updateObservableArray),this._errBack);

                return promise;
            },
            _updateStatus:function(object,status){
                object.status = status;
                return $q.when(object);
            },
            _updateLocalStore: function (object) {
                return this._chatStore.put(angular.copy(object)).then(function (result) {
                    return (typeof result === "object") ? result : object;
                }, function (err) {
                    return $q.reject(err);
                });
            },
            _updateObservableArray:function(object){
              var objectToUpdate = object && this._chatMap[String(object.localId)];

                return objectToUpdate?this._updateObjectToObservableArray(objectToUpdate,object): this._addObjectToObservableArray(object);
            },
            _updateObjectToObservableArray:function(objectToUpdate,object){
                object = object || {};
                var isChanged = objectToUpdate.status !== object.status;
                if(isChanged){
                    objectToUpdate.status = object.status;
                }
                return  objectToUpdate;
            },
            _updateObservableArrayWithArray:function(array){
              angular.forEach(array,angular.bind(this,function(object){
                this._updateObservableArray(object);
              }));
                return this._observableArray;
            },
            _addObjectToObservableArray:function(object){
              if(this._observableArray instanceof Array && object){
                  this._chatMap[String(object.localId)] = object;
                  this._observableArray.push(object);
                  return object;
              }
                return null;
            },
            _updateMasterStore: function (object) {
                return this._masterStore.add(object).then(function (result) {
                    return result;
                }, function (err) {
                    return $q.reject(err);
                });
            },
            syncIncomingChats:function(){
                return this._getLastIncomingChatTimeStamp()
                    .then(angular.bind(this,this._downloadIncomingChats),this._errBack)
                    .then(angular.bind(this,this._saveDownloadedIncomingChats),this._errBack)
                    .then(angular.bind(this,this._postNewChatsAvailableNotfication),this._errBack);
            },
            syncOutgoingChats:function(){
                return this._getLastOutgoingChatTimeStamp()
                    .then(angular.bind(this,this._downloadOutgoingChats),this._errBack)
                    .then(angular.bind(this,this._saveDownloadedOutgoingChats),this._errBack)
                    .then(angular.bind(this,this._postNewChatsAvailableNotfication),this._errBack);
            },
            _postNewChatsAvailableNotfication:function(array){
                if(this.isNewChatAvailable || this.isNewChatUpdateAvailable){
                    var self = this;
                    $timeout(function(){
                        self.publish("new_chats_available");
                    },10);
                }
                this.isNewChatAvailable = false;
                return array;
            },
            _getLastOutgoingChatTimeStamp:function(){
                var time = 0;
                return this._chatStore.query(
                    {
                        status : 'received',
                        to_user: this.receiver
                    },{
                        sort: [{attribute: 'timestamp',descending: true}],
                        count:1
                    }
                ).then(function(result){
                        time = result[0] && result[0].timestamp;
                        return time || 1;
                    },function(err){
                        time = 1;
                        return time;
                    });
            },
            _getLastIncomingChatTimeStamp:function(){
                var time = 0;
                return this._chatStore.query(
                    {
                        to_user:this.sender,
                        status : 'received'
                    },{
                        sort: [{attribute: 'timestamp',descending: true}],
                        count:1
                    }
                ).then(function(result){
                        time = result[0] && result[0].timestamp;
                        return time || 1;
                    },function(err){
                        time = 1;
                        return time;
                    });
            },
            _downloadOutgoingChats:function(time) {
                var nowTime = (new Date()).getTime();
                return this._masterStore.query({
                    status: "received",
                    from_user:this.sender,
                    to_user: this.receiver,
                    timestamp: [time, nowTime]
                }).then(function(results){
                    return results;
                },function(err){
                    return $q.reject(err);
                });
            },
            _downloadIncomingChats:function(time){
                var nowTime = (new Date()).getTime();
                return this._masterStore.query({
                    to_user:this.sender,
                    from_user:this.receiver,
                    timestamp:[time,nowTime]
                });
            },
            _saveDownloadedIncomingChats:function(results){
                this.isNewChatAvailable = !!results.length;
                return this._saveDownloadedChats(results);
            },
            _saveDownloadedOutgoingChats:function(results){
                this.isNewChatUpdateAvailable = !!results.length;
                return this._saveDownloadedChats(results);
            },
            _saveDownloadedChats:function(results){
                var self = this;
                var defs = [];
                angular.forEach(results,function(item){
                    var promise = self._updateStatus(item,'received')
                        .then(angular.bind(self,self._updateLocalStore),self._errBack)
                       .then(angular.bind(self,self._updateMasterStore),self._errBack);
                    defs.push(promise);
                });
                return $q.all(defs);
            },
            readChats: function (friend) {
                return this._chatStore.query(
                    [{
                        to_user: friend
                    },{
                        from_user: friend
                    }],
                    {
                        sort: [
                            {attribute: 'timestamp', descending: true}
                        ],count: 50
                    }).then(angular.bind(this,this._reverseArray))
                    .then(angular.bind(this,this._updateObservableArrayWithArray));

            },
            _reverseArray:function(results){
                return $filter('orderBy')(results, 'timestamp', false);
            },
            _emptyArray: function (err) {
                return [];
            },
            _generateChatObject: function (userID, message) {
                return {
                    localId: this._generateLocalId(userID),
                    to_user: userID,
                    from_user: this.sender,
                    timestamp: (new Date()).getTime(),
                    message: message,
                    status: "notsent",
                    objectId: null
                };
            },
            _generateLocalId: function (userID) {
                var d = new Date();
                return  userID + String(d.getTime()) + Math.floor(Math.random() * 10);
            },
            _errBack: function (err) {
                return $q.reject(err);
            }

        });

        return ChatApi;

    }

    angular.module('rijit.dataService').factory('RJChatApi', ['$q','$filter', '$timeout','RJEvented', 'RJParseStoreFactory', RJChatApi]);

}());
(function() {
    'use strict';


    function RJEvented() {

            return {
                subscribe: function(topic, listener) {
                    if (!this.topics){
                        this.topics = {};
                    }
                    // Create the topic's object if not yet created
                    if(!this.topics[topic]){ this.topics[topic] = { queue: [] };}

                    // Add the listener to queue
                    var index = this.topics[topic].queue.push(listener) -1;

                    // Provide handle back for removal of topic
                    var self = this;
                    return {
                        remove: function() {
                            delete self.topics[topic].queue[index];
                        }
                    };
                },
                publish: function(topic, info) {
                    if (!this.topics){
                        this.topics = {};
                    }
                    // If the topic doesn't exist, or there's no listeners in queue, just leave
                    if(!this.topics[topic] || !this.topics[topic].queue.length) {return;};

                    // Cycle through topics queue, fire!
                    var items = this.topics[topic].queue;
                    items.forEach(function(item) {
                        item(info || {});
                    });
                }
            };

    }
   angular.module('rijit.dataService').factory('RJEvented', [ RJEvented]);

}());
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
(function() {
    'use strict';


    function RJIDBStoreFactory(RJAppGlobal, RJSQLSchemaApi ,RJIndexedDBStore,$q) {



        var FactoryConstructor = function (config) {
            this.rjIndexedDb = RJAppGlobal.data.db;
        };

        angular.extend(FactoryConstructor.prototype, {

            getStore: function (table) {
                var def = $q.defer();
                this.rjIndexedDb.createTable(table,RJSQLSchemaApi.get(table)).then(function(rjDB){
                    def.resolve(new RJIndexedDBStore({
                        rjIndexedDB:rjDB,
                        table:table
                    }));
                },function(err){
                    def.reject(err);
                });
                return def.promise;
            }

        });

        return (new FactoryConstructor());
    }
    angular.module('rijit.dataService').factory('RJIDBStoreFactory', ['RJAppGlobal','RJSQLSchemaApi' ,'RJIndexedDBStore','$q' ,RJIDBStoreFactory]);

}());
(function () {
    'use strict';


    function RJImagesUploader($timeout, $q, $cordovaImagePicker) {

        var FactoryConstructor = function (config) {
            config = config || {};
            this._user= config.user;
            this._imageStore = config.imageStore;
            this._fileUploadStore = config.fileUploadStore || {};
        };

        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 5; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }
        var testImage1 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QCsRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgExAAIAAAAfAAAAWodpAAQAAAABAAAAegAAAAAAAABIAAAAAQAAAEgAAAABQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAeKADAAQAAAABAAAAUAAAAAD/4Qr9aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkQxRTkyMjAzMEVFOTExRTRBNDRBODQwODM0OTI5RTkwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkQxRTkyMjA0MEVFOTExRTRBNDRBODQwODM0OTI5RTkwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkQxRTkyMjAxMEVFOTExRTRBNDRBODQwODM0OTI5RTkwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkQxRTkyMjAyMEVFOTExRTRBNDRBODQwODM0OTI5RTkwIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9InciPz4A/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/iDFhJQ0NfUFJPRklMRQABAQAADEhMaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIACQAGADEAAGFjc3BNU0ZUAAAAAElFQyBzUkdCAAAAAAAAAAAAAAAAAAD21gABAAAAANMtSFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWNwcnQAAAFQAAAAM2Rlc2MAAAGEAAAAbHd0cHQAAAHwAAAAFGJrcHQAAAIEAAAAFHJYWVoAAAIYAAAAFGdYWVoAAAIsAAAAFGJYWVoAAAJAAAAAFGRtbmQAAAJUAAAAcGRtZGQAAALEAAAAiHZ1ZWQAAANMAAAAhnZpZXcAAAPUAAAAJGx1bWkAAAP4AAAAFG1lYXMAAAQMAAAAJHRlY2gAAAQwAAAADHJUUkMAAAQ8AAAIDGdUUkMAAAQ8AAAIDGJUUkMAAAQ8AAAIDHRleHQAAAAAQ29weXJpZ2h0IChjKSAxOTk4IEhld2xldHQtUGFja2FyZCBDb21wYW55AABkZXNjAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAA81EAAQAAAAEW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";

        angular.extend(FactoryConstructor.prototype, {
            _getDevicePictures : function(options){
               //return $cordovaImagePicker.getPictures(options).then(function(results){
               //    return results;
               //},function(err){
               //    return $q.reject(err);
               //});
                return $q.when([testImage1]);
            },
            selectAndUpload: function (options) {
                var defArray = [],self = this,def=$q.defer();
                this._getDevicePictures(options)
                    .then(function (results) {
                        var i;
                        for (i = 0; i < results.length; i++) {
                            defArray.push = self._uploadImagePromise(results[i]);
                        }
                        def.resolve(defArray);
                    }, function (err) {
                        def.reject(err);
                    });

                return def.promise;
            },
            errBack : function (err) {
                return $q.reject(err);
            },
            getImageFromUrl: function (url) {
                var def = $q.defer();
                var img = new Image();
                img.onload = function () {
                    def.resolve(img);
                };
                img.onerror = function(err){
                    def.reject(err);
                };
                img.src = url;
                return def.promise;
            },
            getBytesFromImage: function (img) {
                var def = $q.defer(), imageData,
                    canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var imageData = canvas.toDataURL();
                return $q.when(imageData);

            },
            uploadFileToParse  : function(imageData){
                //var file = new this.Parse.File("image.jpeg", { base64: imageData });
                return this._fileUploadStore.add({
                    name:"image.jpeg",
                    data: imageData
                }).then(function (file) {
                    //return "dummyUrl";
                    return $q.when(file.url());
                }, function (err) {
                    return $q.reject(err);
                });
            },
            saveImageRecord:function(obj){
                return this._imageStore.save(obj);
            },
            _uploadImagePromise: function (localPath) {
                var isVertical = false;

                return  this.getImageFromUrl(localPath)
                    .then(function(img){
                        isVertical = (img.width/img.height) < 1;
                        return img;
                    },this.errBack)
                    .then(angular.bind(this,this.getBytesFromImage),this.errBack)
                    .then(angular.bind(this,this.uploadFileToParse),this.errBack)
                    .then(angular.bind(this,this._saveImageRecord,this._user,localPath,isVertical),this.errBack);

            },
            _saveImageRecord:function(user,localPath,isVertical,uploadedUrl){
                return this._imageStore.add({
                    image:uploadedUrl,
                    user:user,
                    localImage:null,
                    orientation:isVertical?"vertical":"horizontal"
                });
            }

        });

        return FactoryConstructor;
    }

    angular.module('rijit.dataService').factory('RJImagesUploader', ['$timeout', '$q', '$cordovaImagePicker', RJImagesUploader]);

}());
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
(function () {
    'use strict';

    function RJIndexedDBStore($q,RJShimIndexedDB) {

        var IndexedDbStore = function (config) {
            config = config || {};
            this.rjIndexedDB = config.rjIndexedDB;
            this.table = config.table;
            this.idProperty = "localId";
        };

        angular.extend(IndexedDbStore.prototype, {

            _getObjectStore: function (mode) {
                if (this.rjIndexedDB.getDB().objectStoreNames.contains(this.table)) {
                    return this.rjIndexedDB.getDB().transaction([this.table], mode).objectStore(this.table);
                }

                return null;
            },

            get: function (id) {
                id = (id === undefined)?"":id;
                var def = $q.defer(),self = this;
                var objectStore = this._getObjectStore("readonly");
                var request = objectStore.get(id);

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };

                request.onsuccess = function (event) {
                    var idObj = {};
                    idObj[self.idProperty] = id;
                    def.resolve(angular.extend(event.target.result, idObj));

                };

                return def.promise;
            },
            getIdentity: function (object) {
                return object[this.idProperty];
            },

            add: function (object, options) {
                options = options || {};
                if (options[this.idProperty] !== undefined && options[this.idProperty] !== null ) {
                    return this.put(object, options);
                }

                var def = new $q.defer();
                var self = this;

                var request = this._getObjectStore("readwrite").add(object);
                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };
                request.onsuccess = function (event) {
                    var result = {};
                    result[self.idProperty] = event.target.result;
                    def.resolve(angular.extend(object, result));
                    // self.notify(lang.mixin(data,{id:event.target.result}));
                };
                //  alert("Name for SSN 444-44-4444 is " + request.result.name);
                return def.promise;

            },


            put: function (object, options) {
                options = options || {};
                if (options[this.idProperty] === undefined || options[this.idProperty] === null) {
                    return this.add(object, options);
                }
                var def = new $q.defer();
                object = object || {};
                if (object[this.idProperty] === undefined || object[this.idProperty] === null) {
                    object[this.idProperty] = null;
                }

                var objectStore = this._getObjectStore("readwrite");

                var request = objectStore.get(object[this.idProperty]);
                var self = this;
                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };
                request.onsuccess = function (event) {
                    var newData = request.result || {};
                    angular.extend(newData, object);
                    var requestUpdate = null;

                    requestUpdate = objectStore.put(newData);

                    requestUpdate.onerror = function (event) {
                        def.reject(event.target.error.message);
                    };
                    requestUpdate.onsuccess = function (event) {
                        def.resolve(event.target.result);
                        if (typeof self.notify === "function") {
                            self.notify(newData, event.target.result);
                        }
                    };

                };
                return def.promise;

            },


            remove: function (id) {
                var def = new $q.defer();
                var self = this;

                var objectStore = this._getObjectStore("readwrite");

                var request = objectStore['delete'](id);

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };

                request.onsuccess = function (event) {
                    def.resolve(event.target.result);
                    if (typeof self.notify === "function") {

                        self.notify(undefined, event.target.result);
                    }
                };
                return def.promise;

            },


            query: function (query, options) {

                options = options || {};
                var start = options.start || 0;
                var limit = options.limit || options.count || undefined;
                var index = 0;
                var def = new $q.defer();
                var order = "next";
                if (options && options.sort && options.sort[0] && options.sort[0].descending === true) {
                    order = "prev";
                }
                var list = [];
                var self = this;
                var objectStore = null;
                var idbkeyrange;
                if (Object.keys(query).length === 0) {
                    objectStore = this._getObjectStore("readonly");
                } else {
                    var key = Object.keys(query)[0];
                    try {
                        objectStore = this._getObjectStore("readonly").index(key);
                    } catch (e) {
                        return null;
                    }
                    if (query[key] instanceof Array && query[key].length === 2) {
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.bound(query[key][0], query[key][1]);
                    } else if(/\*$/.test(query[key])){
                        var searchRegexStr = query[key].toString();
                        // 			var searchText = searchRegexStr.slice(0,searchRegexStr.length-1);
                        var searchText = searchRegexStr.replace(/\*$/, function (str) {
                            return "";
                        });
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.bound(searchText, searchText + '\uffff');
                    }else{
                        idbkeyrange = RJShimIndexedDB.IDBKeyRange.only(query[key]);

                    }

                }
                var request = objectStore.openCursor(idbkeyrange, order);
                request.onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {

                        if (index === start) {
                            if (list.length === limit) {
                                def.resolve(list);
                                return;
                            }
                            var result = {};
                            result[self.idProperty] = cursor.primaryKey;
                            list.push(angular.extend(cursor.value, result));

                            cursor['continue']();
                        } else {

                            try {
                                cursor.advance(start - index);
                            } catch (e) {
                                console.error(e);
                            }

                            index = start;
                        }

                    }
                    else {
                        // params.callback(list);

                        def.resolve(list);
                    }
                };

                request.onerror = function (event) {
                    def.reject(event.target.error.message);
                };


                return def.promise;
            }


        });

        return IndexedDbStore;

    }

    angular.module('rijit.dataService').factory('RJIndexedDBStore', ['$q', 'RJShimIndexedDB',RJIndexedDBStore]);

}());
(function() {
    'use strict';


    function RJLang() {

        var delegate = (function(){
            // boodman/crockford delegation w/ cornford optimization
            function TMP(){return;}
            return function(obj, props){
                TMP.prototype = obj;
                var tmp = new TMP();
                TMP.prototype = null;
                if(props){
                    angular.extend(tmp, props);
                }
                return tmp; // Object
            };
        }());

        return {
            delegate:delegate,
            hitch:angular.bind,
            mixin:angular.extend
        };
    }
   angular.module('rijit.dataService').factory('RJLang', [RJLang]);

}());
(function() {
    'use strict';


    function RJLocalStore(RJAppGlobal, $q) {



        var FactoryConstructor = function (config) {
           return;
        };

        FactoryConstructor.prototype = RJAppGlobal.data.sqlStoreFactory;

        return new FactoryConstructor();
    }
   angular.module('rijit.dataService').factory('RJLocalStore', ['RJAppGlobal', '$q', RJLocalStore]);

}());
(function() {
    'use strict';


    function RJNotificationCenter($http, $q , RJEvented) {

        var FactoryConstructor = function (config) {
            return;
        };

        angular.extend(FactoryConstructor.prototype, RJEvented);


        return new FactoryConstructor();
    }
   angular.module('rijit.dataService').factory('RJNotificationCenter', ['$http', '$q','RJEvented', RJNotificationCenter]);

}());
(function () {
    'use strict';

    function RJParseArrayToJSON($q) {


        var ParseArrayToJSON = function () {
            return;
        };
        angular.extend(ParseArrayToJSON.prototype, {
            convert: function (def) {
                var localDef = $q.defer();
                var self = this;
                def.then(function (object) {
                    var result =  (object instanceof Array) ? self._convertToJSONArray(object):object;
                    localDef.resolve(result);
                },function(err){
                    localDef.reject(err);
                });
                return localDef.promise;

            },
            _convertToJSONArray:function(object){
                var array = [];
                angular.forEach(object,function(value){
                    var convertedValue = typeof value.toJSON === "function" ? value.toJSON():value;
                    array.push(convertedValue);
                });
                return array;
            }
        });

        return ParseArrayToJSON;
    }

    angular.module('rijit.dataService').factory('RJParseArrayToJson', ['$q', RJParseArrayToJSON]);

}());
(function() {
    'use strict';


    function RJParseFileStore($q,RJParse) {

        var FactoryConstructor = function (config) {
            return;
        };

        angular.extend(FactoryConstructor.prototype, {

            add: function (obj) {
                var file = new RJParse.File(obj.name || "image.jpeg", { base64: obj.data }),
                    def = $q.defer();

                 file.save().then(function(file){
                     def.resolve(file);
                 },function(err){
                     return $q.reject(err);
                 });
                return def.promise;
            }

        });

        return FactoryConstructor;
    }
   angular.module('rijit.dataService').factory('RJParseFileStore', ['$q','RJParse', RJParseFileStore]);

}());
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
(function () {
    'use strict';

    function RJParseObjectToJSON($q) {


        var ParseObjectToJSON = function () {
            return;
        };
        angular.extend(ParseObjectToJSON.prototype, {
            convert: function (def) {
                var localDef = $q.defer();
                def.then(function (object) {
                    var result = typeof object.toJSON === "function" ? object.toJSON():object;
                    localDef.resolve(result);
                },function(err){
                    localDef.reject(err);
                });
                return localDef.promise;
            }
        });

        return ParseObjectToJSON;
    }

    angular.module('rijit.dataService').factory('RJParseObjectToJson', ['$q', RJParseObjectToJSON]);

}());
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
                var collection =  RJParse.User || null;
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
(function () {
    'use strict';

    function RJShimIndexedDB() {

        /*NOTE:To use this you must include https://github.com/axemclion/IndexedDBShim in your
        * index.html and overwrite the _useShim method to modify window._indexedDb,window._IDBDatabase,etc
        * */

         var poorIndexedDbSupport =  window.navigator.userAgent.indexOf("iPhone OS") !== -1;
        if(poorIndexedDbSupport && window.shimIndexedDB) {
            window.shimIndexedDB.__useShim();
        }

        var shimIndexedDB = {
            indexedDB: window._indexedDB || window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
            IDBDatabase: window._IDBDatabase || window.IDBDatabase,
            IDBTransaction: window._IDBTransaction || window.IDBTransaction,
            IDBCursor: window._IDBCursor || window.IDBCursor,
            IDBKeyRange: window._IDBKeyRange || window.IDBKeyRange
        };
        return shimIndexedDB;

    }

    angular.module('rijit.dataService').factory('RJShimIndexedDB', [RJShimIndexedDB]);

}());
(function () {

    function RJWebSQLStore($q) {

        var wildcardRe = /(.*)\*$/;
        function convertExtra(object){
            // converts the 'extra' data on sql rows that can contain expando properties outside of the defined column
            return object && angular.extend(object, JSON.parse(object.__extra));
        }
        var delegate = (function(){
            // boodman/crockford delegation w/ cornford optimization
            function TMP(){return;}
            return function(obj, props){
                TMP.prototype = obj;
                var tmp = new TMP();
                TMP.prototype = null;
                if(props){
                    angular.extend(tmp, props);
                }
                return tmp; // Object
            };
        }());

        var WebSQLStore = function (config) {
            var dbConfig = config.dbConfig;
            if(config.idProperty){
                this.idProperty = config.idProperty;
            }
            // open the database and get it configured
            // args are short_name, version, display_name, and size
            //if(window.sqlitePlugin){
            //    this.database = window.sqlitePlugin.openDatabase({name:config.dbName || "dojo-db"});
            //}
            //else
            {
                this.database = openDatabase(config.dbName || "dojo-db", '1.0', 'dojo-db', 6*1024*1024);
            }

            var indexPrefix = this.indexPrefix = config.indexPrefix || "idx_";
            var storeName = config.table || config.storeName;
            this.table = (config.table || config.storeName).replace(/[^\w]/g, '_');
            var promises = []; // for all the structural queries
            // the indices for this table
            this.indices = dbConfig.stores[storeName];
            this.repeatingIndices = {};
            for(var index in this.indices){
                // we support multiEntry property to simulate the similar behavior in IndexedDB, we track these because we use the
                if(this.indices[index].multiEntry){
                    this.repeatingIndices[index] = true;
                }
            }
            if(!dbConfig.available){
                // the configuration where we create any necessary tables and indices
                for(var storeName in dbConfig.stores){
                    var storeConfig = dbConfig.stores[storeName];
                    var table = storeName.replace(/[^\w]/g, '_');
                    // the __extra property contains any expando properties in JSON form
                    var idConfig = storeConfig[this.idProperty];
                    var indices = ['__extra', this.idProperty + ' ' + ((idConfig && idConfig.autoIncrement) ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')];
                    var repeatingIndices = [this.idProperty];
                    for(var index in storeConfig){
                        if(index != this.idProperty){
                            indices.push(index);
                        }
                    }
                    promises.push(this.executeSql("CREATE TABLE IF NOT EXISTS " + table+ ' ('
                        + indices.join(',') +
                        ')'));
                    for(var index in storeConfig){
                        if(index != this.idProperty){
                            if(storeConfig[index].multiEntry){
                                // it is "repeating" property, meaning that we expect it to have an array, and we want to index each item in the array
                                // we will search on it using a nested select
                                repeatingIndices.push(index);
                                var repeatingTable = table+ '_repeating_' + index;
                                promises.push(this.executeSql("CREATE TABLE IF NOT EXISTS " + repeatingTable + ' (id,value)'));
                                promises.push(this.executeSql("CREATE INDEX IF NOT EXISTS idx_" + repeatingTable + '_id ON ' + repeatingTable + '(id)'));
                                promises.push(this.executeSql("CREATE INDEX IF NOT EXISTS idx_" + repeatingTable + '_value ON ' + repeatingTable + '(value)'));
                            }else{
                                promises.push(this.executeSql("ALTER TABLE " + table + ' ADD ' + index).then(null, function(){
                                    /* suppress failed alter table statements*/
                                }));
                                // otherwise, a basic index will do
                                if(storeConfig[index].indexed !== false){
                                    promises.push(this.executeSql("CREATE INDEX IF NOT EXISTS " + indexPrefix +
                                        table + '_' + index + ' ON ' + table + '(' + index + ')'));
                                }
                            }
                        }
                    }
                }
                dbConfig.available = $q.all(promises);
            }
            this.available = dbConfig.available;
        };

        angular.extend(WebSQLStore.prototype, {
            idProperty:"localId",
            selectColumns: ["*"],
            get: function(id){
                // basic get() operation, query by id property
                return $q.when(this.executeSql("SELECT " + this.selectColumns.join(",") + " FROM " + this.table + " WHERE " + this.idProperty + "=?", [id]), function(result){
                    return result.rows.length > 0 ? convertExtra(result.rows.item(0)) : undefined;
                });
            },
            getIdentity: function(object){
                return object[this.idProperty];
            },
            remove: function(id){
                return this.executeSql("DELETE FROM " + this.table + " WHERE " + this.idProperty + "=?", [id]); // Promise
                // TODO: remove from repeating rows too
            },
            identifyGeneratedKey: true,
            add: function(object, directives){
                // An add() wiill translate to an INSERT INTO in SQL
                var params = [], vals = [], cols = [];
                var extra = {};
                var actionsWithId = [];
                var store = this;
                for(var i in object){
                    if(object.hasOwnProperty(i)){
                        if(i in this.indices || i == this.idProperty){
                            if(this.repeatingIndices[i]){
                                // we will need to add to the repeating table for the given field/column,
                                // but it must take place after the insert, so we know the id
                                actionsWithId.push(function(id){
                                    var array = object[i];
                                    return $q.all(array.map(function(value){
                                        return store.executeSql('INSERT INTO ' + store.table + '_repeating_' + i + ' (value, id) VALUES (?, ?)', [value, id]);
                                    }));
                                });
                            }else{
                                // add to the columns and values for SQL statement
                                cols.push(i);
                                vals.push('?');
                                params.push(object[i]);
                            }
                        }else{
                            extra[i] = object[i];
                        }
                    }
                }
                // add the "extra" expando data as well
                cols.push('__extra');
                vals.push('?');
                params.push(JSON.stringify(extra));

                var idColumn = this.idProperty;
                if(this.identifyGeneratedKey){
                    params.idColumn = idColumn;
                }
                var sql = "INSERT INTO " + this.table + " (" + cols.join(',') + ") VALUES (" + vals.join(',') + ")";
                return $q.when(this.executeSql(sql, params), function(results) {
                    var id = results.insertId;
                    object[idColumn] = id;
                    // got the id now, perform the insertions for the repeating data
                    return $q.all(actionsWithId.map(function(func){
                        return func(id);
                    })).then(function(){
                        return id;
                    });
                });
            },
            put: function(object, directives){
                // put, if overwrite is not specified, we have to do a get() to determine if we need to do an INSERT INTO (via add), or an UPDATE
                directives = directives || {};
                var id = directives.id || object[this.idProperty];
                var overwrite = directives.overwrite;
                if(overwrite === undefined){
                    // can't tell if we need to do an INSERT or UPDATE, do a get() to find out
                    var store = this;
                    return this.get(id).then(function(previous){
                        if((directives.overwrite = !!previous)){
                            directives.overwrite = true;
                            return store.put(object, directives);
                        }else{
                            return store.add(object, directives);
                        }
                    });
                }
                if(!overwrite){
                    return store.add(object, directives);
                }
                var sql = "UPDATE " + this.table + " SET ";
                var params = [];
                var cols = [];
                var extra = {};
                var promises = [];
                for(var i in object){
                    if(object.hasOwnProperty(i)){
                        if(i in this.indices || i == this.idProperty){
                            if(this.repeatingIndices[i]){
                                // update the repeating value tables
                                this.executeSql('DELETE FROM ' + this.table + '_repeating_' + i + ' WHERE id=?', [id]);
                                var array = object[i];
                                for(var j = 0; j < array.length; j++){
                                    this.executeSql('INSERT INTO ' + this.table + '_repeating_' + i + ' (value, id) VALUES (?, ?)', [array[j], id]);
                                }
                            }else{
                                cols.push(i + "=?");
                                params.push(object[i]);
                            }
                        }else{
                            extra[i] = object[i];
                        }
                    }
                }
                cols.push("__extra=?");
                params.push(JSON.stringify(extra));
                // create the SETs for the SQL
                sql += cols.join(',') + " WHERE " + this.idProperty + "=?";
                params.push(object[this.idProperty]);

                return $q.when(this.executeSql(sql, params), function(result){
                    return id;
                });
            },
            query: function(query, options){
                options = options || {};
                var from = 'FROM ' + this.table;
                var condition;
                var addedWhere;
                var store = this;
                var table = this.table;
                var params = [];
                if(query.forEach){
                    // a set of OR'ed conditions
                    condition = query.map(processObjectQuery).join(') OR (');
                    if(condition){
                        condition = '(' + condition + ')';
                    }
                }else{
                    // regular query
                    condition = processObjectQuery(query);
                }
                if(condition){
                    condition = ' WHERE ' + condition;
                }
                function processObjectQuery(query){
                    // we are processing an object query, that needs to be translated to WHERE conditions, AND'ed
                    var conditions = [];
                    for(var i in query){
                        var filterValue = query[i];
                        function convertWildcard(value){
                            // convert to LIKE if it ends with a *
                            var wildcard = value && value.match && value.match(wildcardRe);
                            if(wildcard){
                                params.push(wildcard[1] + '%');
                                return ' LIKE ?';
                            }
                            params.push(value);
                            return '=?';
                        }
                        if(filterValue){
                            if(filterValue.contains){
                                // search within the repeating table
                                var repeatingTable = store.table + '_repeating_' + i;
                                conditions.push(filterValue.contains.map(function(value){
                                    return store.idProperty + ' IN (SELECT id FROM ' + repeatingTable + ' WHERE ' +
                                        'value' + convertWildcard(value) + ')';
                                }).join(' AND '));
                                continue;
                            }else if(typeof filterValue == 'object' && ("from" in filterValue || "to" in filterValue)){
                                // a range object, convert to appropriate SQL operators
                                var fromComparator = filterValue.excludeFrom ? '>' : '>=';
                                var toComparator = filterValue.excludeTo ? '<' : '<=';
                                if('from' in filterValue){
                                    params.push(filterValue.from);
                                    if('to' in filterValue){
                                        params.push(filterValue.to);
                                        conditions.push('(' + table + '.' + i + fromComparator + '? AND ' +
                                            table + '.' + i + toComparator + '?)');
                                    }else{
                                        conditions.push(table + '.' + i + fromComparator + '?');
                                    }
                                }else{
                                    params.push(filterValue.to);
                                    conditions.push(table + '.' + i + toComparator + '?');
                                }
                                continue;
                            }
                        }
                        // regular value equivalence
                        conditions.push(table + '.' + i + convertWildcard(filterValue));
                    }
                    return conditions.join(' AND ');
                }

                if(options.sort){
                    condition += ' ORDER BY ' +
                        options.sort.map(function(sort){
                            return table + '.' + sort.attribute + ' ' + (sort.descending ? 'desc' : 'asc');
                        });
                }

                var limitedCondition = condition;
                if(options.count){
                    limitedCondition += " LIMIT " + options.count;
                }
                if(options.start){
                    limitedCondition += " OFFSET " + options.start;
                }
                var results = delegate(this.executeSql('SELECT * ' + from + limitedCondition, params).then(function(sqlResults){
                    // get the results back and do any conversions on it
                    var results = [];
                    for(var i = 0; i < sqlResults.rows.length; i++){
                        results.push(convertExtra(sqlResults.rows.item(i)));
                    }
                    return results;
                }));
                var store = this;
                results.total = {
                    then: function(callback,errback){
                        // lazily do a total, using the same query except with a COUNT(*) and without the limits
                        return store.executeSql('SELECT COUNT(*) ' + from + condition, params).then(function(sqlResults){
                            return sqlResults.rows.item(0)['COUNT(*)'];
                        }).then(callback,errback);
                    }
                };
                return results;
            },

            executeSql: function(sql, parameters){
                // send it off to the DB
                var deferred = $q.defer();
                var result, error;
                this.database.transaction(function(transaction){
                    transaction.executeSql(sql, parameters, function(transaction, value){
                        deferred.resolve(result = value);
                    }, function(transaction, e){
                        deferred.reject(error = e);
                    });
                });
                // return synchronously if the data is already available.
                if(result){
                    return result;
                }
                if(error){
                    throw error;
                }
                return deferred.promise;
            }

        });

        return WebSQLStore;

    }

    angular.module('rijit.dataService').factory('RJWebSQLStore', ['$q',RJWebSQLStore]);

}());
(function () {
    'use strict';

    var defaultInterfaces = ['get', 'add', 'put', 'remove', 'query'];
    angular.module('rijit.dataService').value('defaultInterfaces', defaultInterfaces);

}());

(function () {
    'use strict';

    var RJParse = window.Parse || {};
    angular.module('rijit.dataService').value('RJParse', RJParse);

}());



(function () {
    'use strict';


    function DataService(emptyDatasource, defaultInterfaces) {

        var DService = function (datasource) {
            this.dataSource = datasource || emptyDatasource;
        };
        var interfaces = defaultInterfaces;

        angular.forEach(interfaces, function (intFace) {
            DService.prototype[intFace] = function () {
                this.dataSource[intFace].apply(this, arguments || []);
            };
        });


        return DService;

    }
    angular.module('rijit.dataService').factory('DataService', ['emptyDatasource', 'defaultInterfaces', DataService]);

}());


(function () {
    'use strict';

    function emptyDatasource(defaultInterfaces) {

        var noImplementation = function () {
            console.log('no implementation');
        };
        var emptyDs = {};

        var interfaces = defaultInterfaces;

        angular.forEach(interfaces, function (intF) {
            emptyDs[intF] = noImplementation;
        });

        return emptyDs;

    }
    angular.module('rijit.dataService').factory('emptyDatasource', ['defaultInterfaces', emptyDatasource]);

}());