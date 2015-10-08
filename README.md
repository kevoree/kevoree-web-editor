# Kevoree Web Editor [![Build Status](https://drone.io/github.com/kevoree/kevoree-web-editor/status.png)](https://drone.io/github.com/kevoree/kevoree-web-editor/latest)

Web app for [Kevoree](http://kevoree.org/) model management  
You can try it here [http://editor.kevoree.org](http://editor.kevoree.org)

## Overview
 - [What is it for ?](README.md#what-is-it-for-)
 - [How do I use it ?](README.md#how-do-i-use-it-)
 - [How do I contribute ?](README.md#how-do-i-contribute-)

## What is it for ?
The purpose of Kevoree Web Editor (KWE) is to provide an easy-to-use tool to manage your [Kevoree](http://kevoree.org/) models  & runtimes.  
It is written in Javascript and has been designed to work as a static standalone Web application.

## How do I use it ?

```sh
# only once :
npm install # retrieve the dependencies
bower install

grunt serve
```

### Prerequisites
 - an up-to-date browser because it uses many "new" features: **WebSocket**, **LocalStorage**, **WebSQL**, **SVG**, etc.
 - some [Kevoree-related knowledge](http://kevoree.org/doc/#getting-started)
