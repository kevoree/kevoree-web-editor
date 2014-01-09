module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jade: {
      html: {
        files: {
          'dist/': ['site/views/*.jade']
        },
        options: {
          client: false,
          pretty: true,
          locals: {
            title: 'Kevoree Web Editor - <%= pkg.version %>'
          }
        }
      },
      amd: {
        files: {
          'site/js/app/templates/': ['site/templates/*.jade']
        },
        options: {
          wrap: 'amd',
          runtime: false
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: 'site/js',
          paths: {
            util:         'app/util',
            abstraction:  'app/editor/abstraction',
            visitor:      'app/editor/visitor',
            control:      'app/editor/control',
            resolver:     'app/editor/resolver',
            presentation: 'app/editor/presentation',
            factory:      'app/editor/factory',
            command:      'app/editor/command',
            templates:    'app/templates',
            bootstrap:    'lib/bootstrap/src',
            runtime:      'lib/jadeRuntime',
            jquery:       'lib/jquery'
          },
          name: 'editor',
          out: 'dist/js/editor.js'
        }
      }
    },
    copyto: {
      stuff: {
        files: [
          {
            cwd: 'site/',
            src: [ '**/*' ],
            dest: 'dist/'
          }
        ],
        options: {
          // array of ignored paths
          ignore: [
            'site/js/app{,/**/*}',
            'site/js/lib{,/**/*}',
            'site/js/editor.js',
            'site/views{,/**/*}',
            'site/templates{,/**/*}'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-jade');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-copy-to');
  
  grunt.registerTask('default', ['jade', 'requirejs', 'copyto']);
}