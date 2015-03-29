describe("RJIncomingChat for syncing chats", function () {

    /***********Arrange-START************/
    var chatApi, timeout, rootScope;


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));



    var MockChatStore = function () {
        this.query = function(){};
        this.add = function(){};
        this.put = function(){};
        return;
    };
    var MockMasterStore = function () {
        this.query = function(){};
        this.add = function(){};
        this.put = function(){};
        return;
    };
    var senderUserId = "1234";
    var friendUserId = "4321";
    var mockObj = {
        localId : "localId",
        objectId : "xxxx",
        status : 'sent'
    },q;

    var chatArray = [{
        localId:"localid1",
        objectId:"objectId1",
        message: "incomingmessag1",
        to_user: friendUserId,
        from_user:senderUserId,
        status : "received",
        timestamp: 100
    },
        {
            localId:"localid2",
            message: "incomingmessag2",
            to_user: friendUserId,
            from_user:senderUserId,
            status : "sent",
            timestamp: 200
        }];
    var masterArray = [
        {
            localId:"localid1",
            objectId:"objectId1",
            message: "incomingmessag1",
            to_user: friendUserId,
            from_user:senderUserId,
            status : "received",
            timestamp: 100
        },{
        objectId:"objectId2",
            localId:"localid2",
        message: "incomingmessag2",
            to_user: friendUserId,
            from_user:senderUserId,
        status : "received",
        timestamp: 200
    }];


    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJChatApi, $q, $timeout,$rootScope) {
        rootScope = $rootScope;
        q = $q;
        timeout = $timeout;
        chatApi = new RJChatApi({
            chatStore: (new MockChatStore()),
            masterStore: (new MockMasterStore()),
            sender: senderUserId
        });

    }));

    /***********Arrange-END************/


    it("posts notification for new updated outgoing chat", function () {
        var thisChatArray = angular.copy(chatArray),
            thisMasterArray = angular.copy(masterArray);
        spyOn(chatApi._chatStore,'query').and.callFake(function(query,options){
            expect(options.sort[0]).toEqual({attribute:'timestamp',descending: true});
            return q.when(thisChatArray);
        });
        spyOn(chatApi._chatStore,'put').and.callFake(function(object){
            var found = false;
            angular.forEach(thisChatArray,function(item){
                if(item.localId === object.localId){
                    angular.extend(item,object);
                    found = true;
                }
            });

            if(!found){
                thisChatArray.push(object);
            }
            return q.when(object.localId);
        });
        spyOn(chatApi._masterStore,'query').and.callFake(function(query){
            expect(query.timestamp[0]).toEqual(thisChatArray[0].timestamp);

            return q.when(thisMasterArray.slice(1));
        });
        spyOn(chatApi._masterStore,'add').and.callFake(function(object){
            var found = false;
            angular.forEach(thisMasterArray,function(item){
                if(item.objectId === object.objectId){
                    angular.extend(item,object);
                    found = true;
                }
            });
            if(!found){
                object.objectId = "objectId"+Math.random()*100;
                thisMasterArray.push(object);
            }
            return q.when(object);
        });
        var obj = {
            callback : function(){}
        };
        spyOn(obj,'callback');
        var chatApiListner = chatApi.subscribe("new_chats_available", obj.callback);
        chatApi.syncOutgoingChats();
        rootScope.$apply();
        timeout.flush(10);
        expect(thisChatArray[1].objectId).toEqual(thisMasterArray[1].objectId);
        expect(thisChatArray[1].message).toEqual(thisMasterArray[1].message);
        expect(thisChatArray[1].status).toEqual('received');

        expect(obj.callback).toHaveBeenCalled();
    });

    it("should not posts notification for no new updated outgoing chat", function () {
        var thisChatArray = angular.copy(chatArray),
            thisMasterArray = angular.copy(masterArray);
        spyOn(chatApi._chatStore,'query').and.callFake(function(query,options){
            expect(options.sort[0]).toEqual({attribute:'timestamp',descending: true});
            return q.when(thisChatArray);
        });
        spyOn(chatApi._chatStore,'put').and.callFake(function(object){
            var found = false;
            angular.forEach(thisChatArray,function(item){
                if(item.localId === object.localId){
                    angular.extend(item,object);
                    found = true;
                }
            });

            if(!found){
                thisChatArray.push(object);
            }
            return q.when(object.localId);
        });
        spyOn(chatApi._masterStore,'query').and.callFake(function(query){
            expect(query.timestamp[0]).toEqual(thisChatArray[0].timestamp);
            return q.when(thisMasterArray.slice(2));
        });
        spyOn(chatApi._masterStore,'add').and.callFake(function(object){
            var found = false;
            angular.forEach(thisMasterArray,function(item){
                if(item.objectId === object.objectId){
                    angular.extend(item,object);
                    found = true;
                }
            });
            if(!found){
                object.objectId = "objectId"+Math.random()*100;
                thisMasterArray.push(object);
            }
            return q.when(object);
        });
        var obj = {
            callback : function(){}
        };
        spyOn(obj,'callback');
        var chatApiListner = chatApi.subscribe("new_chats_available", obj.callback);
        chatApi.syncOutgoingChats();
        rootScope.$apply();
        expect(thisChatArray.length).toEqual(2);
        expect(obj.callback).not.toHaveBeenCalled();
    });



});