# Kevoree Web Editor [![Build Status](https://travis-ci.org/kevoree/kevoree-web-editor.svg?branch=master)](https://travis-ci.org/kevoree/kevoree-web-editor)

Web app for [Kevoree](http://kevoree.org/) model management  
You can try it here [https://editor.kevoree.org](https://editor.kevoree.org)

## Overview
 - [What is it for ?](README.md#what-is-it-for-)
 - [How do I use it ?](README.md#how-do-i-use-it-)
 - [How do I contribute ?](README.md#how-do-i-contribute-)

## What is it for ?
The purpose of Kevoree Web Editor (KWE) is to provide an easy-to-use tool to manage your [Kevoree](http://kevoree.org/) models  & runtimes.  
It is written in Javascript and has been designed to work as a static standalone Web application.

## Usage

### Docker
The editor can also be deployed locally in **Docker**
```sh
docker run -p 9090:80 -d kevoree/editor
```

Then go to http://localhost:9090

### Manual install
```sh
npm install
grunt serve
```
