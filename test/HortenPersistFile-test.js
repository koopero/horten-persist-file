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
    const file = resolveTmp( 'ring.?.json' )
    const glob = resolveTmp( 'ring.*.json' )
    
    // Ensure empty before starting
    assert.equal( countFiles(), 0 )
    const persist = new HortenPersistFile( { root, file } )

    for ( let i = 0; i < 12; i ++ ) {
      const data = test.number()
      const path = test.path()
      root.patch( data, path )
      await new Promise( ( cb ) => setTimeout( cb, 150 ) )
    }

    assert.equal( countFiles(), 10 )

    function countFiles() {
      const globlib = require('glob')
      let files = globlib.sync( glob )
      return files.length
    }
  } )


  it('will read from ring loop', async () => {
    const H = require('horten')
    const HortenPersistFile = require('../index')
    const file = resolveTmp( 'ring.?.json' )
    const glob = resolveTmp( 'ring.*.json' )
    const writeRoot = new H.Mutant()
    const writer = new HortenPersistFile( { root: writeRoot, file } )

    for ( let i = 0; i < 24; i ++ ) {
      const data = test.number()
      const path = test.path()
      writeRoot.patch( data, path )
      await new Promise( ( cb ) => setTimeout( cb, 150 ) )
    }
   
    const readRoot = new H.Mutant()
    const reader = new HortenPersistFile( { root: readRoot, file } )
    await reader.open()
    assert.deepEqual( readRoot.get(), writeRoot.get() )
  } )
})

