describe("First Test",function(){

    var counter;
    beforeEach(function(){
        counter = 0;
        });

    it("increments counter",function(){
        counter++;
            expect(counter).toEqual(1);
        });

    it("decrments counter",function(){
        counter--;
        expect(counter).toEqual(-1);
    });



});