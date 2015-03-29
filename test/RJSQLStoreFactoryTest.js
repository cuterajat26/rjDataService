describe("RJSQLStoreFactoryTest", function () {

    /***********Arrange-START************/
    var storeFactory, testDBName = "testDB";

    var dummySchemas = {
        TestStore: {
            objectId: {},
            timestamp: {},
            status: {},
            message: {}
        }
    };

    var dummyRJWebSQLStore = function () {
        return;
    };

    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));

    beforeEach(function () {
        //your initialization
        return;
    });


    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJSQLStoreFactory, $q, $timeout) {

        storeFactory = new RJSQLStoreFactory({
            RJWebSQLStore: dummyRJWebSQLStore,
            schemas: dummySchemas,
            dbName: testDBName
        });

    }));

    /***********Arrange-END************/
    it("initializes properly", function () {

        expect(storeFactory.dbName).toEqual(testDBName);
        expect(typeof storeFactory.dbVersion).toEqual("number");
        expect(storeFactory.stores).toEqual(dummySchemas);
        expect(typeof storeFactory._getDBConfig).toEqual("function");
        expect(typeof storeFactory.getStore).toEqual("function");

    });

    it("returns store instance", function () {
        expect(storeFactory.getStore() instanceof dummyRJWebSQLStore).toBeTruthy();

    });
    it("fetches dbConfig properly", function () {

        expect(storeFactory._getDBConfig().stores).toEqual(dummySchemas);
        expect(typeof storeFactory._getDBConfig().version).toEqual("number");
    });

});