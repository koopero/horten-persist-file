const test = require('./_test')
const pathlib = require('path')
const resolveTmp = pathlib.resolve.bind( null, __dirname, 'tmp' )
const fs = require('fs-extra')
const assert = require('chai').assert


describe('horten-persist-file', () => {

  beforeEach( async () => {
    fs.remove( pathlib.resolve( __dirname, 'tmp/' ) )
  })

  it('will write a file', ( done ) => {
    const H = require('horten')
    const HortenPersistFile = require('../index')
    const root = new H.Mutant()
    const file = resolveTmp( 'persist.json' )
    const data = test.number()
    const path = test.path()
    const persist = new HortenPersistFile( { root, file } )

    persist.on('write', ( wrotefile ) => {
      assert.equal( file, wrotefile )
      let wroteData = fs.readJSONSync( file )
      assert.deepEqual( wroteData, root.get() )
      done()
    })

    root.patch( data, path )
  })

  it('will write multiple files in ring', async () => {
    const H = require('horten')
    const HortenPersistFile = require('../index')
    const root = new H.Mutant()
    const file = resolveTmp( 'ring.json' )
    const glob = resolveTmp( 'ring.*.json' )
    
    // Ensure empty before starting
    assert.equal( countFiles(), 0 )

    const count = 3
    const persist = new HortenPersistFile( { root, file, count } )

    for ( let i = 0; i < count * 2; i ++ ) {
      const data = test.number()
      const path = test.path()
      root.patch( data, path )
      await new Promise( ( cb ) => setTimeout( cb, 200 ) )
    }

    assert.equal( countFiles(), count )

    function countFiles() {
      const globlib = require('glob')
      let files = globlib.sync( glob )
      return files.length
    }
  } )
})

