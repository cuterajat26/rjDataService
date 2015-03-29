describe("RJLocalStoreTest", function () {

    /***********Arrange-START************/
    var rjLocalStore;


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));

    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJAppGlobal) {

        RJAppGlobal.data.sqlStoreFactory = {
            getStore: function () {
                return [];
            }
        };
    }));


    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJLocalStore) {
        rjLocalStore = RJLocalStore;
    }));

    /***********Arrange-END************/
    it("defines proper interface functions", function () {

        expect(rjLocalStore.getStore).toBeDefined();
        expect(typeof rjLocalStore).toEqual('object');

    });

});