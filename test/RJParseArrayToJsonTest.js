describe("RJParseArrayToJsonTest", function () {

    /***********Arrange-START************/
    var parseDef, resultDef , parseArray, convertedArray, expectedArray;


    //load the module which needs to be tested
    beforeEach(angular.mock.module("rijit.dataService"));

    beforeEach(function () {
        var obj1 = createParseObjectWithToJsonFunction(),
            obj2 = createParseObjectWithToJsonFunction(),
            obj3 = createParseObjectWithToJsonFunction();
        parseArray = [obj1, obj2, obj3];
        expectedArray = [obj1.toJSON(), obj2.toJSON(), obj3.toJSON()];
    });


    //Inject $controller,$rootScope to instantiate,$http to use the mocked $http
    beforeEach(angular.mock.inject(function (RJParseArrayToJson, $q, $timeout) {
        var parseArrayToJson = new RJParseArrayToJson();
        parseDef = $q.defer();
        resultDef = parseArrayToJson.convert(parseDef.promise);


        resultDef.then(function (result) {
            convertedArray = result;
        });

        $timeout(function () {
            parseDef.resolve(parseArray);

        }, 0);

        $timeout.flush(0);


    }));

    /***********Arrange-END************/
    it("produces json array", function () {

        expect(convertedArray).toEqual(expectedArray);

    });

});