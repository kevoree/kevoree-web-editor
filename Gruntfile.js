module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      all: ['dist', 'templato'],
      dist: ['dist'],
      templato: ['templato']
    },
    templato: {
      all: {
        files: { templato: 'site' },
        values: grunt.file.readJSON('config.json')
      }
    },
    jade: {
      html: {
        files: {
          'templato/': ['templato/views/*.jade']
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
          'templato/js/app/templates/': ['templato/templates/*.jade']
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
          baseUrl: 'templato/js',
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
      prod: {
        files: [
          {
            cwd: 'templato/',
            src: [ '**/*' ],
            dest: 'dist/'
          }
        ],
        options: {
          // array of ignored paths
          ignore: [
            'templato/js/app{,/**/*}',
            'templato/js/lib{,/**/*}',
            'templato/js/editor.js',
            'templato/views{,/**/*}',
            'templato/templates{,/**/*}'
          ]
        }
      },
      dev: {
        files: [
          {
            cwd: 'templato/',
            src: [ '**/*' ],
            dest: 'dist/'
          }
        ],
        options: {
          // array of ignored paths
          ignore: [
            'templato/views{,/**/*}',
            'templato/templates{,/**/*}'
          ]
        }
      }
    },
    watch: {
      scripts: {
        files: ['templato/**/*'],
        tasks: ['dev'],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-templato');
  grunt.loadNpmTasks('grunt-jade');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-copy-to');
  
  grunt.registerTask( 'default',
    'Compile jade templates, optimize requireJS AMD files with r.js and copy files to dist/ directory',
    ['clean', 'templato', 'jade', 'requirejs', 'copyto:prod', 'clean:templato']
  );
  grunt.registerTask( 'dev',
    'Same as default, but without optimizing AMD files (time consuming)',
    ['clean', 'templato', 'jade', 'copyto:dev', 'clean:templato']
  );
}