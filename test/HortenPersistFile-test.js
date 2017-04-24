const test = require('./_test')

const fs = require('fs-extra')
    , path = require('path')

const HortenPersistFile = require('../index')

const file = new HortenPersistFile( {
  delayMax: 100,
  file: path.resolve( __dirname, 'tmp/', 'persist.json' )
} )


const root = H.root

mutate()

function mutate() {
  root.patch( test.number(), test.path() )
  setTimeout( mutate, 50 )
}
