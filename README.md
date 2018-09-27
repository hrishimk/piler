# piler
Currently a typescript, sass workflow manager.

I found it easier to write this my self rather than learning to use webpack, gulp etc.

## How it works
- Watches for changes in src folder for .ts and .scss files, 
- Reads tsconfig.json from the src folder
- Transpiles them with typescript and node-sass
- Outputs to specified dir

## Running
    $ ./compile

## Future
- Create a plugin architecture and move tranpilers into different plugins
- Write some plugins
