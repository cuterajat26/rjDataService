rjDataService Angular module
===========================

rjDataService is an angular module to provide dataservices for offline storage,dealing with parse, through a
unified api.


Feature Overview
----------------

* Angular service for WebSql
* Angular service for parse sdk

Bower Install
----------------
*bower* *install* ***cuterajat26/rjDataService***


Include script tags
----------------
```html

    <script type="text/javascript" src="js/parse-1.3.2.min.js"></script>
    <script src="pathToBowerComponents/rjdataService/dist/dataService.min.js"></script>

```
Initialization
---------------
***Add angular module dependency***

```javascript
angular.module("my_app",["rijit.dataService"])
```
Configure Parse
----------
```javascript
angular.module("my_app").run(function (RJAppGlobal) {

        RJAppGlobal.data.application_id = "<parse_app_id>"; //your parse app id(javascript)
            RJAppGlobal.data.api_key = "<parse_api_key>"; //your parse api key

        });
    });
```

Access parse objects - RJParseStoreFactory.getParseUserStore()
--------
**User signup**

```javascript
 angular.module("my_app")
        .controller("MyController", ['RJParseStoreFactory' ,function(RJParseStoreFactory){
        var userStore = RJParseStoreFactory.getParseUserStore();
        var user = {
                'first_name':$scope.credentials.first_name,
                'last_name':$scope.credentials.last_name,
                'email': $scope.credentials.email_full,
                'username': $scope.credentials.user_name,
                'password':'xxxxxxxx'
            };
        userStore.signUp(user)
                        .then(function(result){
                            //successfull
                        },function(error){
                            //failed
                        });
        }]);
```

**Edit User**

```javascript

        var userStore = RJParseStoreFactory.getParseUserStore();

        userStore.put(user)
                        .then(function(result){
                            //successfull
                        },function(error){
                            //failed
                        });
        }]);
```

**Other stores** -- RJParseStoreFactory.getParseStore('<collection_name>')

Add record

```javascript

        var commentsStore = RJParseStoreFactory.getParseStore('comments');
        var comment = {user:'userid',content:'hi this is a comment'};
        commentsStore.add(comment)
                                .then(function(result){
                                    //successfull
                                },function(error){
                                    //failed
                                });
                }]);

```

Put record

```javascript

        var commentsStore = RJParseStoreFactory.getParseStore('comments');
        var comment = {user:'userid',content:'hi this is a comment'};

                comment.content = "new content";
                comment.objectId = "12212323334sdfsdf23";

                 commentsStore.put(comment)
                                                .then(function(result){
                                                    //successfull
                                                },function(error){
                                                    //failed
                                                });
                                }]);

```
MIT License

