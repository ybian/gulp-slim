(function() {
  var PLUGIN_NAME, PluginError, gutil, spawn, through;

  spawn = require('spawn-cmd').spawn;

  through = require('through2');

  gutil = require('gulp-util');

  PluginError = gutil.PluginError;

  PLUGIN_NAME = 'gulp-slim';

  module.exports = function(options) {
    var args, cmnd;
    if (options == null) {
      options = {};
    }
    cmnd = 'slimrb';
    args = [];
    if (options.bundler) {
      cmnd = 'bundle';
      args = ['exec', 'slimrb'];
    }
    args.push('-s');
    if (options.pretty) {
      args.push('-p');
    }
    if (options.erb) {
      args.push('-e');
    }
    if (options.compile) {
      args.push('-c');
    }
    if (options.rails) {
      args.push('--rails');
    }
    if (options.translator) {
      args.push('-t');
    }
    if (options.locals) {
      args.push('-l');
      args.push(options.locals);
    }
    if (options.options) {
      if (options.options.constructor === Array) {
        options.options.forEach(function(opt) {
          args.push("-o");
          return args.push(opt);
        });
      } else if (options.options.constructor === String) {
        args.push('-o');
        args.push(options.options);
      }
    }
    return through.obj(function(file, encoding, callback) {
      var b, eb, ext, original_file_path, program;
      if (file.isNull()) {
        return callback(null, file);
      }
      if (file.isStream()) {
        return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
      }
      original_file_path = file.path;
      ext = options.erb ? '.erb' : '.html';
      file.path = gutil.replaceExtension(file.path, ext);
      program = spawn(cmnd, args);
      b = new Buffer(0);
      eb = new Buffer(0);
      program.stdout.on('readable', function() {
        var chunk, _results;
        _results = [];
        while (chunk = program.stdout.read()) {
          _results.push(b = Buffer.concat([b, chunk], b.length + chunk.length));
        }
        return _results;
      });
      program.stdout.on('end', function() {
        file.contents = b;
        return callback(null, file);
      });
      program.stderr.on('readable', function() {
        var chunk, _results;
        _results = [];
        while (chunk = program.stderr.read()) {
          _results.push(eb = Buffer.concat([eb, chunk], eb.length + chunk.length));
        }
        return _results;
      });
      program.stderr.on('end', function() {
        var err, msg;
        if (eb.length > 0) {
          err = eb.toString();
          msg = "Slim error in file (" + original_file_path + "):\n" + err;
          return callback(new PluginError(PLUGIN_NAME, msg));
        }
      });
      return program.stdin.write(file.contents, function() {
        return program.stdin.end();
      });
    });
  };

}).call(this);
