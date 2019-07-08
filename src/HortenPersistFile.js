const H = require('horten')
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const yaml = require('js-yaml')
const moment = require('moment')

const DEFAULT_FILE = 'horten-persist-file.yaml'

class HortenPersistFile extends H.Cursor {
  constructor( options ) {
    _.defaults( options, {
      delay: 100,
      delayMax: 1000,
      listening: true
    })
    super( options )
    this.on('value', this.onValue.bind( this ) )
  }

  configure( options ) {
    super.configure( options )
    this.file = path.resolve( options.file || DEFAULT_FILE )
    this.format = options.format == 'yaml' ? 'yaml'
      : ['.yaml','.yml'].indexOf( path.extname( this.file ) ) != -1 ? 'yaml'
        : 'json'

    if ( options.open )
      this.open()


    // console.log('configure', options )
  }

  onValue( value ) {
    if ( !this.writing ) {
      this.write()
    }
  }

  open() {
    const self = this
    return self.read()
      .catch( function () {
        return self.write()
      } )
  }

  read( src ) {
    const self = this
    src = src || this.file

    return fs.readFileAsync( src, 'utf8')
      .then( this.format == 'yaml' ? yaml.load : JSON.parse )
      .then( function ( data ) {
        self.patch( data )
        return data
      })
  }

  header() {
    return '# written by horten-persist-file at '+moment().format()+'\n'
  }

  write( dest ) {
    const self = this
    const data = this.value

    dest = dest || this.file

    var str

    switch ( this.format ) {
      case 'yaml':
        str = this.header() + yaml.dump( data )
      break

      default:
        str = JSON.stringify( data )
      break
    }

    self.writing = true
    return fs.outputFileAsync( dest, str )
    .then( function () {
      self.writing = false
      self.emit('write', dest )
    } )
  }
}

module.exports = HortenPersistFile
