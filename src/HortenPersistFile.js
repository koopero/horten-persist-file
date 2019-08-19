const H = require('horten')
const _ = require('lodash')
const fs = require('fs-extra')
const pathlib = require('path')
const yaml = require('js-yaml')
const moment = require('moment')

const DEFAULT_FILE = 'horten-persist-file.yaml'

class HortenPersistFile extends H.Cursor {
  constructor( options ) {
    _.defaults( options, {
      delay: 100,
      delayMax: 1000,
      listening: true,
      file: '',
      format: '',
      count: 0,
    })
    super( options )
    this.on('value', this.onValue.bind( this ) )
    this.ringIndex = 0
  }

  configure( options ) {
    super.configure( options )
    this.file = pathlib.resolve( options.file || DEFAULT_FILE )
    this.format = options.format == 'yaml' ? 'yaml'
      : ['.yaml','.yml'].indexOf( pathlib.extname( this.file ) ) != -1 ? 'yaml'
        : 'json'

    this.count = parseInt( options.count ) || 0

    if ( options.open )
      this.open()

  }

  onValue() {
    if ( !this.writing ) {
      this.write()
    }
  }

  async open() {
    const self = this
    return self.read()
      .catch( function () {
        return self.write()
      } )
  }

  async read( src ) {
    const self = this
    if ( !src ) {

    }
    src = src || this.file

    return fs.readFile( src, 'utf8')
      .then( this.format == 'yaml' ? yaml.load : JSON.parse )
      .then( function ( data ) {
        self.patch( data )
        return data
      })
  }

  fileToWrite() {
    if ( this.count <= 1 )
      return this.file 

    let file = addExtensionPrefix( this.file, '.' + this.ringIndex )
    this.ringIndex = ( this.ringIndex + 1 ) % this.count
    return file
  }


  header() {
    return '# written by horten-persist-file at '+moment().format()+'\n'
  }

  async write( dest ) {
    const data = this.value

    dest = dest || this.fileToWrite()

    var str

    switch ( this.format ) {
      case 'yaml':
        str = this.header() + yaml.dump( data )
        break

      default:
        str = JSON.stringify( data )
        break
    }

    this.writing = true
    await fs.outputFile( dest, str )
    this.writing = false
    this.emit('write', dest )
  }
}

module.exports = HortenPersistFile


//
// Util functions below
//

function addExtensionPrefix( file, prefix ) {
  let parsed = pathlib.parse( file )
  let result = pathlib.join( parsed.dir, parsed.name + prefix + parsed.ext )
  console.log( result, parsed )
  // process.exit()
  return result
}

async function findNewestFile( file ) {
  const globlib = require('glob-promise')
}