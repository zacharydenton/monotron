module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    coffee:
      compile:
        files:
          'monotron.js': 'monotron.coffee'
    less:
      compile:
        files:
          'monotron.css': 'monotron.less'
    watch:
      all:
        files: ['monotron.coffee', 'monotron.less']
        tasks: ['coffee', 'less']
    connect:
      server:
        options:
          port: 9000
          hostname: '*'

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  # Default task.
  grunt.registerTask 'default', ['connect', 'watch']
