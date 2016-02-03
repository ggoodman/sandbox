// sandbox.js - Rudimentary Javascript Sandbox

/*------------------------- INIT -------------------------*/
var fs = require( 'fs' )
  , path = require( 'path' )
  , spawn = require( 'child_process' ).spawn

/*------------------------- Sandbox -------------------------*/
function Sandbox( options ) {
  ( this.options = options || {} ).__proto__ = Sandbox.options

  this.run = function( code, hollaback ) {
    // Any vars in da house?
    var timer
      , stdout = ''
      , stderr = ''
      , child = spawn( this.options.node, [this.options.shovel] )
      , output = function( data ) {
          if ( !!data )
            stdout += data
        }
      , outputErr = function( data ) {
          if ( !!data )
            stderr += data
        }

    // Listen
    child.stdout.on( 'data', output )
    child.stderr.on( 'data', outputErr )

    child.on( 'close', function( code ) {
      clearTimeout( timer )
      if (stderr) {
        var without_traces = stderr.replace(/\s{4}at(.*)(\n)*/ig, '');
        return hollaback.call( this, {
          '__error': new Error('The user script exited with an exception: \n ' + without_traces)
        });
      }
      var parsed;
      try {
        parsed = JSON.parse( stdout ) ;
      } catch (er) {
        return hollaback.call( this, {
          '__error': new Error(stdout + ' is not a valid JSON')
        });
      }
      hollaback.call( this, parsed );
    });

    // Go
    child.stdin.write( code )
    child.stdin.end()
    timer = setTimeout( function() {
      child.stdout.removeListener( 'data', output )
      stdout = JSON.stringify( { result: 'TimeoutError', console: [] } )
      child.kill( 'SIGKILL' )
    }, this.options.timeout )
  }
}

// Options
Sandbox.options =
  { timeout: 500
  , node: 'node'
  , shovel: path.join( __dirname, 'shovel.js' )
  }

// Info
fs.readFile( path.join( __dirname, '..', 'package.json' ), function( err, data ) {
  if ( err )
    throw err
  else
    Sandbox.info = JSON.parse( data )
})

/*------------------------- Export -------------------------*/
module.exports = Sandbox

