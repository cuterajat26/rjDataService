describe("RJParseUserStoreTest",function(){

    /***********Arrange-START************/
    var mockScope = {},controller ,backend ,userStore,
    dataSource = {
    };

    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));



    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function(RJParseStoreFactory){
        userStore = RJParseStoreFactory.getParseUserStore();


    }));

    /***********Arrange-END************/
    it("proper interface defined",function(){


        expect(typeof userStore.query).toEqual("function");
        expect(typeof userStore.add).toEqual("function");
        expect(typeof userStore.put).toEqual("function");
        expect(typeof userStore.remove).toEqual("function");
        expect(typeof userStore.signUp).toEqual("function");
        expect(typeof userStore.login).toEqual("function");


        //expect(x).toEqual(val) x to be same as val but not necessarily same object
            //expect(x).toBe(obj) //x and obj are the same object
            //expect(x).toMatch(regexp)
            //expect(x).toBeDefined()
            //expect(x).toBeUndefined()
            //expect(x).toBeNull()
            //expect(x).toBeTruthy()
            //expect(x).toBeFalsy()
            //expect(x).toContain(y) asserts that x is a string that contains y
            //expect(x).toBeGreaterThan(y)
        });

});