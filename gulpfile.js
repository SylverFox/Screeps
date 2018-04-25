const gulp = require('gulp')
const clean = require('gulp-clean') //TODO
const flatten = require('gulp-flatten')
const flattenRequires = require('gulp-flatten-requires')
const screeps = require('gulp-screeps')

const config = require('./config')

gulp.task('watch', () => {
  gulp.watch(config.src, ['push_private'])
})

gulp.task('production', () => {
  gulp.start('push_main')
})

gulp.task('clean', () => {
  return gulp.src(config.dst).pipe(clean())
})

gulp.task('build', ['clean'], (done) => {
  return gulp.src(config.dst)
    .pipe(flatten())
    .pipe(flattenRequires())
    .on('error', done)
    .pipe(gulp.dest('dist/'))
})

gulp.task('push_private', ['build'], () => {
  return gulp.src(config.dst)
    .pipe(screeps(config.dev))
})

gulp.task('push_main', ['build'], () => {
  return gulp.src(config.dst)
    .pipe(screeps(config.main))
})