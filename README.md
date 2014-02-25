# Kevoree Web Editor [![Build Status](https://drone.io/github.com/kevoree/kevoree-web-editor/status.png)](https://drone.io/github.com/kevoree/kevoree-web-editor/latest)


## Build
Either ways will produce a `dist/` folder containing the static Web client  

### Javascript way
```sh
npm install
bower install
grunt build
```

### Maven way
```sh
mvn install
```

## Development process
```sh
grunt serve
```
This will start a livereload server on port :8080 that will be autorefreshed each time a modification occurs in the code
