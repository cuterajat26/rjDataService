describe("RJChatApiTest", function () {

    /***********Arrange-START************/
    var chatApi, fetchedChats, rootScope;


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));


    var MockChatStore = function () {
        return;
    };
    var MockMasterStore = function () {
        return;
    };
    var senderUserId = "1234";
    var friendUserId = "4321";
    var message = "hello world";
    var mockObj = {
        localId : "localId",
        objectId : "xxxx",
        status : 'sent'
    },q;
    var mockQueryResults = [mockObj];

    beforeEach(angular.mock.inject(function ($q, $rootScope) {
        rootScope = $rootScope;
        q = $q;
        MockChatStore.prototype.put = function (object) {
            var def = $q.defer();
            def.resolve(object);
            return def.promise;

        };
        MockChatStore.prototype.query = function (object) {
            var def = $q.defer();
            def.resolve([]);
            return def.promise;

        };
        MockMasterStore.prototype.add = function (object) {
            object.objectId = "xxxx";
            var def = $q.defer();
            def.resolve(object);
            return def.promise;
        };

        MockMasterStore.prototype.query = function (filters,options) {
            return $q.when(mockQueryResults);
        };

    }));

    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJChatApi, $q, $timeout) {
        chatApi = new RJChatApi({
            chatStore: (new MockChatStore()),
            masterStore: (new MockMasterStore()),
            sender: senderUserId
        });

    }));

    /***********Arrange-END************/
    it("produces json array", function () {

        expect(typeof chatApi.sendChat).toEqual("function");
        expect(typeof chatApi.readChats).toEqual("function");

    });

    it("returns an empty array for readChats", function () {
        var fetchPromise = chatApi.readChats(friendUserId);
        fetchPromise.then(function (results) {
            fetchedChats = results;
            expect(results.length).toEqual(0);
        });
        rootScope.$apply();

    });

    it("returns default last incoming chat timestamp", function () {
        spyOn(chatApi._chatStore,'query').and.callFake(function(){
           return q.when([]);
        });
        var fetchPromise = chatApi._getLastIncomingChatTimeStamp();
        fetchPromise.then(function (time) {
            expect(time).toEqual(1);
        });
        rootScope.$apply();

    });

    it("returns default last outgoing chat timestamp", function () {
        spyOn(chatApi._chatStore,'query').and.callFake(function(){
            return q.when([]);
        });
        var fetchPromise = chatApi._getLastOutgoingChatTimeStamp();
        fetchPromise.then(function (time) {
            expect(time).toEqual(1);
        });
        rootScope.$apply();

    });

    it("returns the saved chat object", function () {
        var fetchPromise = chatApi.readChats(friendUserId);
        fetchPromise.then(function (results) {
            fetchedChats = results;
            expect(results.length).toEqual(0);
        });
        rootScope.$apply();

        var sendPromise = chatApi.sendChat(friendUserId, message);
        sendPromise.then(function (object) {
            expect(typeof object.localId).not.toEqual('number');
            expect(object.from_user).toEqual(senderUserId);
            expect(object.status).toEqual("notsent");
            expect(object.to_user).toEqual(friendUserId);
            expect(chatApi.objectId).toBeUndefined();
            expect(fetchedChats.length).toEqual(1);
            expect(fetchedChats[0]).toEqual(object);

        });
        sendPromise.sync.then(function (object) {
            expect(object.status).toEqual("sent");
            expect(object.objectId).toBeDefined();
            expect(fetchedChats.length).toEqual(1);
            expect(fetchedChats[0]).toEqual(object);
        });
        rootScope.$apply();

        spyOn(chatApi,"_postNewChatsAvailableNotfication").and.callThrough();
       var promiseDownloadChats =  chatApi.syncIncomingChats();
        promiseDownloadChats.then(function(object){
           expect(object instanceof Array).toBeTruthy();
           expect(object[0].status).toEqual('received');
            expect(chatApi._postNewChatsAvailableNotfication).toHaveBeenCalledWith(object);

        });
        rootScope.$apply();

    });

});