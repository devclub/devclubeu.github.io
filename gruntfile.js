module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var pkg = grunt.file.readJSON('package.json');
  
  var project = {};
  project.libs = [
    'vendor/underscore/underscore.js',
    'vendor/moment/moment.js',
    'vendor/moment/locale/ru.js',
    'vendor/jquery/dist/jquery.js',
    'vendor/bootstrap/js/transition.js',
    'vendor/bootstrap/js/tooltip.js',
    'vendor/bootstrap/js/collapse.js',
    'vendor/bootstrap/js/carousel.js',
    'vendor/bootstrap/js/modal.js',
    'vendor/angular/angular.js',
    'vendor/angular-sanitize/angular-sanitize.js',
    'vendor/angular-i18n/angular-locale_ru.js',
    'vendor/angular-scroll/angular-scroll.js'
  ];
  project.srcs = [
    'src/scripts.js'
  ];
  project.styles = 'styles.less';
  project.vendor_assets = [
    {
      src: ['fonts/*'],
      dest: 'assets',
      cwd: 'vendor/font-awesome',
      expand: true
    }
  ];

  grunt.option('pkg_name', pkg.name);
  grunt.option('pkg_version', pkg.version);

  var config = {
    connect: {
      options: {
        base: ['build'],
        middleware: function (connect, options, middlewares) {
          middlewares.push(connect.static(__dirname));
          middlewares.push(function (req, res) {
            require('fs').createReadStream('build/index.html').pipe(res);
          });
          return middlewares;
        }
      },
      build: {
        options: {
          open: false,
          port: 3001,
          hostname: '0.0.0.0',
          livereload: 35729
        }
      },
      product: {
        options: {
          open: false,
          port: 3001,
          hostname: '0.0.0.0',
          keepalive: true
        }
      }
    },
    clean: {
      reports: ['reports'],
      build: ['scripts.js','styles.css','index.html']
    },
    copy: {
      assets: {
        files: project.vendor_assets
      },
      index: {
        files: [
          {
            src: ['index.html'],
            dest: 'build',
            cwd: 'src',
            expand: true
          }
        ],
        options: {
          process: function (contents, path) {
            return grunt.template.process(contents, {
              data: {
                js_files: ['scripts.js']
              }
            });
          }
        }
      }
    },
    less: {
      styles: {
        options: {
          cleancss: false
        },
        files: {
          'build/styles.css': 'src/' + project.styles
        }
      }
    },
    concat: {
      js: {
        src: project.libs.concat(project.srcs),
        dest: 'build/scripts.js'
      }
    },
    cssmin: {
      styles: {
        options: {
          keepSpecialComments: 0
        },
        src: 'styles.css',
        cwd: 'build',
        dest: 'build',
        expand: true
      }
    },
    htmlmin: {
      index: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: [
          {
            src: ['index.html'],
            dest: 'build',
            cwd: 'build',
            expand: true
          }
        ]
      }
    },
    uglify: {
      options: {
        report: 'min',
        compress: {
          drop_console: true
        }
      },
      js: {
        files: {
          'build/scripts.js': ['build/scripts.js']
        }
      }
    },
    ngAnnotate: {
      js: {
        files: [
          {
            expand: true,
            src: 'build/scripts.js'
          }
        ]
      }
    },
    hashres: {
      options: {
        encoding: 'utf8',
        fileNameFormat: '${hash}.${name}.${ext}',
        renameFiles: true
      },
      dist: {
        src: [
          'build/styles.css',
          'build/scripts.js'
        ],
        dest: 'build/index.html'
      }
    },
    watch: {
      options: {
        livereload: true
      },
      style: {
        files: ['src/*.less', 'src/*.css'],
        tasks: ['less:styles']
      },
      html: {
        files: ['src/index.html'],
        tasks: ['copy:index']
      },
      js: {
        files: 'src/**/*.js',
        tasks: ['concat:js']
      }
    }
  };

  grunt.config.init(config);
  grunt.registerTask('default', ['product']);
  grunt.registerTask('info', ['file_info']);

  grunt.registerTask('serve', function () {
    grunt.task.run(['build', 'connect:build', 'watch']);
  });

  grunt.registerTask('serve-product', function () {
    grunt.task.run(['product', 'connect:product']);
  });

  grunt.registerTask('build', [
    'clean:build',
    'copy:assets',
    'concat:js',
    'copy:index',
    'less:styles',
  ]);

  grunt.registerTask('product', [
    'clean:build',
    'copy:assets',
    'concat:js',
    'copy:index',
    'less:styles',

    'cssmin:styles',
    'htmlmin:index',
    'ngAnnotate:js',
    'uglify:js',
    'hashres:dist'
  ]);
};
