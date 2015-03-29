module.exports = function (grunt) {

  // 1. All configuration goes here
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ["dist"],
    watch: {
      options: {
        livereload: false

      },
        ngServices: {
          files: ['src/*.js'],
          tasks: ['karma','concat','uglify'],
          options: {
            spawn: false
          }
        }
      },

      karma: {
        unit: {
          configFile: 'rijitDataservice.config.js',
          autoWatch: false,
          singleRun: true,
          browsers: ['Chrome'],
          logLevel: 'ERROR'
        }
      },
      concat: {
        dist: {
          src: [
            'src/dataService.js',
            'src/*.js'
          ],
          dest: 'dist/dataService.js'
        }
      },
      uglify: {
        build: {
          files: {
            'dist/dataService.min.js': ['dist/dataService.js']
          }
        }
      }



  });

  // 3. Where we tell Grunt we plan to use all the grunt plugins.
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', ['intern:runner']);


  // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.


  grunt.registerTask('default', ['clean', 'concat', 'uglify','watch']);


};
