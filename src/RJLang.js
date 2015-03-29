(function() {
    'use strict';


    function RJLang() {

        var delegate = (function(){
            // boodman/crockford delegation w/ cornford optimization
            function TMP(){return;}
            return function(obj, props){
                TMP.prototype = obj;
                var tmp = new TMP();
                TMP.prototype = null;
                if(props){
                    angular.extend(tmp, props);
                }
                return tmp; // Object
            };
        }());

        return {
            delegate:delegate,
            hitch:angular.bind,
            mixin:angular.extend
        };
    }
   angular.module('rijit.dataService').factory('RJLang', [RJLang]);

}());