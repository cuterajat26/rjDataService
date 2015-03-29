describe("RJParseInterfaceTest", function () {

    /***********Arrange-START************/
    var parseInterface, parseQuery, rootScope;


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));


    var PARSE = function () {
        return;
    };
    var Collection = function () {
        return;
    };
    var ParseQuery = function () {
        return;
    };


    beforeEach(angular.mock.inject(function ($q, $rootScope) {
        rootScope = $rootScope;

        angular.extend(ParseQuery.prototype,{
            find:function(){
                var def = $q.defer();
                def.resolve({});
                return def.promise;
            },
            greaterThan:function(){
              return;
            },
            lessThan: function(){
              return;
            },
            startsWith:function(){
              return;
            },
            equalTo:function(){
              return;
            },
            skip:function(){
              return;
            },
            limit:function(){
               return;
            }

        });
        parseQuery = new ParseQuery();

        PARSE.prototype.Query = function (Collection) {
            return parseQuery;
        };

    }));

    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJParseInterface, $q, $timeout) {
        parseInterface =  new RJParseInterface({
            PARSE : new PARSE(),
            collection: Collection
        });

        spyOn(parseQuery, 'lessThan');
        spyOn(parseQuery, 'greaterThan');
        spyOn(parseQuery, 'equalTo');
        spyOn(parseQuery, 'startsWith');



    }));

    /***********Arrange-END************/
    it("must have basic crud interfaces", function () {

        expect(typeof parseInterface.get).toEqual("function");
        expect(typeof parseInterface.add).toEqual("function");
        expect(typeof parseInterface.put).toEqual("function");
        expect(typeof parseInterface.remove).toEqual("function");
        expect(typeof parseInterface.query).toEqual("function");

    });

    it("calls parseQuery for range", function () {

        parseInterface.query({
            timestamp:[0,100]
        });

        expect(parseQuery.greaterThan).toHaveBeenCalledWith('timestamp',0);
        expect(parseQuery.lessThan).toHaveBeenCalledWith('timestamp',100);
        rootScope.$apply();

    });

    it("calls parseQuery for matching", function () {

        parseInterface.query({
            timestamp:100
        });

        expect(parseQuery.equalTo).toHaveBeenCalledWith('timestamp',100);
        rootScope.$apply();

    });

    it("calls parseQuery for string starting with", function () {

        parseInterface.query({
            name: "rajat*"
        });

        expect(parseQuery.startsWith).toHaveBeenCalledWith('name','rajat');
        rootScope.$apply();

    });

    it("calls parseQuery for exact string match", function () {

        parseInterface.query({
            name: "rajat"
        });

        expect(parseQuery.equalTo).toHaveBeenCalledWith('name','rajat');
        expect(parseQuery.startsWith).not.toHaveBeenCalled();
        rootScope.$apply();

    });




});