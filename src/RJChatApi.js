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