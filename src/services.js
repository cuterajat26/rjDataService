(function () {
    'use strict';

    var defaultInterfaces = ['get', 'add', 'put', 'remove', 'query'];
    angular.module('rijit.dataService').value('defaultInterfaces', defaultInterfaces);

}());

(function () {
    'use strict';

    var RJParse = window.Parse || null;
    angular.module('rijit.dataService').value('RJParse', RJParse);

}());



(function () {
    'use strict';


    function DataService(emptyDatasource, defaultInterfaces) {

        var DService = function (datasource) {
            this.dataSource = datasource || emptyDatasource;
        };
        var interfaces = defaultInterfaces;

        angular.forEach(interfaces, function (intFace) {
            DService.prototype[intFace] = function () {
                this.dataSource[intFace].apply(this, arguments || []);
            };
        });


        return DService;

    }
    angular.module('rijit.dataService').factory('DataService', ['emptyDatasource', 'defaultInterfaces', DataService]);

}());


(function () {
    'use strict';

    function emptyDatasource(defaultInterfaces) {

        var noImplementation = function () {
            console.log('no implementation');
        };
        var emptyDs = {};

        var interfaces = defaultInterfaces;

        angular.forEach(interfaces, function (intF) {
            emptyDs[intF] = noImplementation;
        });

        return emptyDs;

    }
    angular.module('rijit.dataService').factory('emptyDatasource', ['defaultInterfaces', emptyDatasource]);

}());