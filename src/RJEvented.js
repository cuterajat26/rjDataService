(function() {
    'use strict';


    function RJEvented() {

            return {
                subscribe: function(topic, listener) {
                    if (!this.topics){
                        this.topics = {};
                    }
                    // Create the topic's object if not yet created
                    if(!this.topics[topic]){ this.topics[topic] = { queue: [] };}

                    // Add the listener to queue
                    var index = this.topics[topic].queue.push(listener) -1;

                    // Provide handle back for removal of topic
                    var self = this;
                    return {
                        remove: function() {
                            delete self.topics[topic].queue[index];
                        }
                    };
                },
                publish: function(topic, info) {
                    if (!this.topics){
                        this.topics = {};
                    }
                    // If the topic doesn't exist, or there's no listeners in queue, just leave
                    if(!this.topics[topic] || !this.topics[topic].queue.length) {return;};

                    // Cycle through topics queue, fire!
                    var items = this.topics[topic].queue;
                    items.forEach(function(item) {
                        item(info || {});
                    });
                }
            };

    }
   angular.module('rijit.dataService').factory('RJEvented', [ RJEvented]);

}());