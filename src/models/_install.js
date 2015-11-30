var path = require('path')
var Url = require('url')

var Decompress = require('decompress')
var git = require('gift')
var fs = require('fs-extra')
var request = require('request')
var broker = require('../helpers/broker')

var config = require('../../config')

function _installFromDir (dir, done) {
  var file, pkgJson, appRoot, main
  file = path.join(dir, 'package.json')

  broker.info('Setting everything up for you...')

  if (!fs.existsSync(file)) {
    return done(new Error('App does not have a package.json'))
  }

  pkgJson = fs.readJsonSync(file, {throws: false})
  if (!pkgJson) {
    return done(new Error("App's package.json is malformed"))
  }

  appRoot = path.join(config.appsDir, pkgJson.name)
  if (fs.existsSync(appRoot)) {
    return done(new Error('App already exists'))
  }

  // Check if main is an executable file
  main = path.resolve(dir, pkgJson.main)
  if (!fs.existsSync(main)) {
    return done(new Error('App does not have a main executable'))
  } else {
    fs.chmodSync(main, '700')
  }

  fs.move(dir, appRoot, function (err) {
    if (err) return done(err)
    done(null, pkgJson)
  })
}

function _installFromTar (tarball, done) {
  var tmpDir = path.join(config.tmpDir, '' + new Date().getTime())

  broker.info('Unbundling the app...')
  new Decompress().src(tarball).dest(tmpDir)
  .use(Decompress.targz({ strip: 1 })).run(function (err) {
    if (err) return done(err)

    _installFromDir(tmpDir, function (err, appJson) {
      fs.remove(tmpDir, function (err) {
        if (err) return done(err)
      })

      fs.remove(tarball, function (err) {
        if (err) return done(err)
      })

      if (err) return done(err)
      else return done(null, appJson)
    })
  })
}

function _installFromGit (url, done) {
  var tmpDir = path.join(config.tmpDir, '' + new Date().getTime())
  git.clone(url, tmpDir, function (err, repo) {
    if (err) return done(err)

    _installFromDir(repo.path, function (err, appJson) {
      if (err) return done(err)
      return done(null, appJson)
    })
  })
}

function _installFromNetbeast (url, done) {
  console.log('[install] downloading from %s...', url)
  const DOWNLOAD_PATH = '/tmp/app-' + new Date().getTime() + '.tar.gz'
  request({uri: url})
  .pipe(fs.createWriteStream(DOWNLOAD_PATH))
  .on('finish', function () {
    broker.info('Download finished...')
    _installFromTar(DOWNLOAD_PATH, done)
  })
  .on('error', done)
}

function _installFromUrl (url, done) {
  var host = Url.parse(url).host
  console.log('[install] host=%s', host)
  if (host === 'netbeast.co') {
    broker.info('Installing from Netbeast repos...')
    _installFromNetbeast(url, done)
  } else {
    broker.info('Installing from git...')
    _installFromGit(url, done)
  }
}

module.exports = {
  from: {
    dir: _installFromDir,
    git: _installFromGit,
    url: _installFromUrl,
    tar: _installFromTar
  }
}
