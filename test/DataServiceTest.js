describe("DataService Ctrl test",function(){

    /***********Arrange-START************/
    var mockScope = {},controller ,backend ,service,
    dataSource = {
    };

    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));



    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function(DataService){
        service = new DataService();


    }));

    /***********Arrange-END************/
    it("proper interface defined",function(){


            expect(typeof service.query).toEqual("function");
            expect(typeof service.add).toEqual("function");
        expect(typeof service.put).toEqual("function");
        expect(typeof service.remove).toEqual("function");



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