var jshint = require('gulp-jshint');

// jshint the server script
gulp.task('jshint-server', function() {
  gulp.src('./server.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});