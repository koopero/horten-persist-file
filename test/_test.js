const test = exports

test.number = () =>
  Math.round( Math.random() * 4 ) * Math.pow( 2, Math.round( Math.random() * 8 - 3 ) )


const DATA_KEYS = ['echelon','cadillac','funfur','stakeout','vulcan','verbiage']

test.data = function() {
  const result = {}
  for ( var i = 0; i < 3; i ++ ) {
    var ind = Math.floor( DATA_KEYS.length * Math.random() )
      , key = DATA_KEYS[ind]

    result[key] = test.number()
  }

  return result
}

const PATH_KEYS = ['gubernatorial','gyration','geometry','geodesic','jellied']

test.path = function() {
  var result = []
    , keys = PATH_KEYS.slice()
    , length = Math.round( Math.random() * 2 ) + 1

  for ( var i = 0; i < length; i ++ ) {
    var ind = Math.floor( keys.length * Math.random() )
      , key = keys[ind]
    keys.splice( ind, 1 )
    result.push( key )
  }

  return result
}
