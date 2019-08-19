const H = require('horten')
const _ = require('lodash')
const fs = require('fs-extra')
const pathlib = require('path')
const globlib = require('glob-promise')
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
    try {
      await this.read()
    } catch ( err ) {
      // File failed to read, could be it doesn't exist yet.
      await this.write()
    }
  }

  async read( src ) {
    const self = this
    src = src || this.file
    let candidates = await globlib( src )

    candidates = await Promise.all( candidates.map( async ( file ) => {
      try {
        let stat = await fs.stat( file )
        if ( !stat.size )
          return 

        return { file, time: stat.mtimeMs }
      } catch ( err ) {
        // File's fucked. Nothing to do.
      }
    }))

    candidates = _.filter( candidates )
    candidates = _.orderBy( candidates, ['time'], ['desc'] )

    for ( let i = 0; i < candidates.length; i ++ ) {
      let file = candidates[i].file
      let data = await fs.readFile( file, 'utf8' )
      if ( !data )
        continue 

      try { 
        if ( this.format == 'yaml' )
          data = yaml.safeLoad( data )
        else 
          data = JSON.parse( data )
      } catch ( err ) {
        // Fucked encoding. Move on.
        continue
      }

      if ( _.isObject( data ) ) {
        this.patch( data )
        return { file, data }
      }
    }

  }

  fileToWrite() {
    let file = this.file 
    let questions = file.replace( /[^\?]/g, '' )
    questions = questions.length

    if ( !questions )
      return file

    let max = Math.pow( 10, questions )
    let digits = _.padStart( this.ringIndex, questions, '0')
    let index = 0
    file = file.replace(/\?/, () => digits[index++] )
    this.ringIndex = ( this.ringIndex + 1 ) % max
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