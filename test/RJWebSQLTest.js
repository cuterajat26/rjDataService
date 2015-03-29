describe("RJWebSQLStoreTest", function () {

    /***********Arrange-START************/
    var dbConfig = {
        version: 1, // this is required
        dbName:"test-db",
        stores: {
            item: {
                // just declare the properties, will configure later
                name: {},
                price: {},
                inStock: {},
                id : {}
            },
            order: {
                quantity: {}
            }
        }
    };
    var productStore , RJWebSQLStoreService, timeout, Q,rootScope;
    var testItem = {
        name : String((new Date()).getTime()),
        price :50,
        inStock: 100
    };


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));

    beforeEach(angular.mock.inject(function (RJWebSQLStore,$rootScope,$q,$timeout) {
        RJWebSQLStoreService = RJWebSQLStore;
        rootScope = $rootScope;
        Q = $q;
        timeout = $timeout;

    }));

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    var resultId;
    beforeEach(function (done) {


        productStore = new RJWebSQLStoreService({
            dbConfig: dbConfig,
            storeName: 'item'

        });

        productStore.add(testItem).then(function(result){

            resultId = result;
            done();
        },function(err){
            console.log(err);
            done();
        });


        setTimeout(function(){
            rootScope.$apply();

        },100);

//        productStore.available.then(function(){
//            resultRecord = "yo";
//            done();
//        },function(err){
//            done();
//        });


    });


    /***********Arrange-END************/

    it("produces json array", function (done) {

        expect(typeof resultId).toEqual("number");
        done();
    });




});