describe("RJIncomingChatTest2", function () {

    /***********Arrange-START************/
    var chatApi, rootScope;


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
    var mockQueryResults = [mockObj];

    var chatArray = [{
        localId:"localid1",
        objectId:"objectId1",
        message: "incomingmessag1",
        to_user: senderUserId,
        from_user:friendUserId,
        status : "received",
        timestamp: 100
    },{
        objectId:"objectId2",
        localId:"localid2",
        message: "incomingmessag2",
        to_user: senderUserId,
        from_user:friendUserId,
        status : "received",
        timestamp: 200
    }];
    var masterArray = [
        {
            localId:"localid1",
            objectId:"objectId1",
            message: "incomingmessag1",
            to_user: senderUserId,
            from_user:friendUserId,
            status : "received",
            timestamp: 100
        },{
        objectId:"objectId2",
            localId:"localid2",
        message: "incomingmessag2",
        to_user: senderUserId,
        from_user:friendUserId,
        status : "received",
        timestamp: 200
    }];


    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJChatApi, $q, $rootScope) {
        rootScope = $rootScope;
        q = $q;
        chatApi = new RJChatApi({
            chatStore: (new MockChatStore()),
            masterStore: (new MockMasterStore()),
            sender: senderUserId
        });

    }));

    /***********Arrange-END************/


    it("should not posts notification if both local and remote stores are in sync", function () {
        var thisChatArray = angular.copy(chatArray),
            thisMasterArray = angular.copy(masterArray);
        spyOn(chatApi._chatStore,'query').and.callFake(function(){
            return q.when(thisChatArray.slice(1));//passing the last 'received' chat
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
        spyOn(chatApi._masterStore,'query').and.callFake(function(query,options){
            var result = [];
            if(query.timestamp && query.timestamp instanceof Array){
                angular.forEach(thisMasterArray,function(item){
                    if(item.timestamp >  query.timestamp[0]){
                        result.push(item);
                    }
                });
                return q.when(result);
            }
            return q.when(thisMasterArray);
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
        chatApi.syncIncomingChats();
        rootScope.$apply();
        expect(thisChatArray[1].objectId).toEqual(thisMasterArray[1].objectId);
        expect(thisChatArray[1].message).toEqual(thisMasterArray[1].message);

        expect(obj.callback).not.toHaveBeenCalled();
    });




});