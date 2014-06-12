# Kevoree Web Editor [![Build Status](https://drone.io/github.com/kevoree/kevoree-web-editor/status.png)](https://drone.io/github.com/kevoree/kevoree-web-editor/latest)

Web app for [Kevoree](http://kevoree.org/) model management  
You can use the demo version here [editor.kevoree.org](http://editor.kevoree.org)

## Overview
 - [What is it for ?](README.md#what-is-it-for-)
 - [How do I use it ?](README.md#how-do-i-use-it-)
 - [How do I contribute ?](README.md#how-do-i-contribute-)

## What is it for ?
The purpose of Kevoree Web Editor (KWE) is to provide an easy-to-use tool to manage your [Kevoree](http://kevoree.org/) models  & runtimes.  
It is mostly written in Javascript and has been designed to work as a static standalone Web application.

## How do I use it ?
### Prerequisites
 - an up-to-date browser because it uses **WebSocket**, **LocalStorage** and **Canvas**
 - some [Kevoree-related knowledge](http://kevoree.org/doc/#getting-started)

### User interface basics
KWE's UI is composed of 3 main components:
 - a menu bar (top panel)
 - a TypeDefinition list + search/filter field (left panel)
 - a Kevoree model editor (center)

![KWE](http://hosta.braindead.fr/raw/539973e81a9879c239a1a21c)

### Menu bar content
#### File menu
 Menu item      | Description                                                                                                              | Shortcut
--------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------
Load            | Load a model from a JSON file client-side                                                                                | Ctrl+L
Merge           | Same as "Load" but merging given model with the current model in KWE                                                     | Ctrl+M
Open from node  | Load a model from a remote node reachable using [Kevoree WebSocket protocol](README.md#kevoree-groups-websocket-protocol)| Ctrl+O
Merge from node | Same as "Open from node" but merging retrieved model with the current model in KWE                                       | Ctrl+Shift+M
Save as JSON    | Save the current model in KWE to a JSON file client-side                                                                 | Ctrl+S

#### Model menu
 Menu item                 | Description                                                                                       | Shortcut
-------------------------- | ------------------------------------------------------------------------------------------------- | ---------
Clear All                  | Reset the current model to an empty one (empty TypeDefinition list and empty model graph)         | Alt+A
Clear Instances            | Delete every instances in the current model (empty model graph)                                   | Alt+I
Clear Unused Type Defs     | Parse the current model in order to remove the unused TypeDefinition (no instance means unused)   | Alt+U
Kevoree Standard Libraries | Open the **Kevoree Standard Libraries** popup ([see below](README.md#kevoree-standard-libraries)) | Alt+K
From custom repository     | Open the **From custom repository** popup ([see below](README.md#from-custom-repository))         | <none>
Custom push                | Open the **Custom push** popup ([see below](README.md#custom-push))                               | <none>

#### Edit menu
 Menu item      | Description                                                                 | Shortcut
--------------- | --------------------------------------------------------------------------- | ---------
Undo            | Undo last model modification (:exclamation: **NOT IMPLEMENTED YET**)        | Ctrl+Z
Redo            | Redo last model modification (:exclamation: **NOT IMPLEMENTED YET**)        | Ctrl+Y
Settings        | Configure your KWE settings (saved locally using your browser LocalStorage) | Ctrl+K
Server settings | Open the **Server settings** popup ([see below](README.md#server-settings)) | Ctrl+H

#### KevScript menu
Open the **KevScript** popup ([see below](README.md#kevscript))

#### Help menu
Open the **Help** popup ([see below](README.md#help))

### KWE popups
#### Server settings
Because KWE is a standalone Web application, it gives you the possibility to specify the server you want to connect to.  
To specify your own KWE-server, use this popup.  
By default, [editor.kevoree.org](http://editor.kevoree.org) uses an **Express** web server hosted on the same machine.  
 > You can clone the sources of [kevoree/kevoree-web-editor-server](https://github.com/kevoree/kevoree-web-editor-server) and deploy it on your own servers

![KWE Server settings](http://hosta.braindead.fr/raw/539980c11a9879c239a1a21e)

#### Kevoree Standard Libraries
This popup allows you to merge Kevoree's official TypeDefinitions to your current model.  
Kevoree Standard Libraries are available (currently, June 2014) for 3 platforms:
 - Java
 - Javascript
 - Cloud

Once the list loaded, you can select wanted libraries and hit the **Merge libraries** button and wait for the server you are connected to (specified in the popup title after @), to answer your request with the according Kevoree model.  

![KWE Std Libs](http://hosta.braindead.fr/raw/539980bd1a9879c239a1a21d)

#### From custom repository
If you want to merge your own Kevoree libraries from a custom Maven repository you can by using this popup.  
This will trigger the resolving server-side, then it will retrieve the model of your library (still server-side) and send it back to KWE, resulting in a merge of your current KWE model and the one you have specified in this popup.  

![KWE Custom repo](http://hosta.braindead.fr/raw/539980cc1a9879c239a1a221)

#### Custom push
Sometimes you have to edit your model network attributes resulting in the impossibility for you to push your model to your platforms (your group WebSocket server won't be able to receive the model according to the new network attributes, because it is still launched on the old model network attributes)  
Using this popup, you can specify a group WebSocket server directly and ask for a push of your current model by pressing **Push model**  

![KWE Custom push](http://hosta.braindead.fr/raw/539980cf1a9879c239a1a222)

#### KevScript
A [Kevoree Script](http://kevoree.org/doc/#kevoree-script-aka-kevscript) (aka KevScript) editor providing syntax highlighting and auto-completion.  
By default, this KevScript editor content is dinamically created according to the current model (model2kevs processing), but you can also change the content by using the provided examples (dropdown selector in the top-right corner).  
Once you are done editing, you have two choices:
 - **Download**: saves the current KevScript to a **.kevs** file client-side
 - **Run**: process your script and updates the current Kevoree model in KWE

![KWE KevScript](http://hosta.braindead.fr/raw/539993c91a9879c239a1a223)  

The KevScript Editor also provides some shortcuts to improve user experience:

 Action       |    Shortcut
------------- | --------------
Search        | Ctrl+F
Find next     | Ctrl+G
Find previous | Ctrl+Shift+G
Replace       | Ctrl+Shift+F
Replace all   | Ctrl+Shift+R


#### Help
This popup contains the whole list of shortcuts available in KWE, plus some useful information concerning the editor.  

![KWE Help](http://hosta.braindead.fr/raw/539980c91a9879c239a1a220)

### Model edition
#### Add TypeDefinition to your model
To add TypeDefinition to your model you have multiple choices:
 - Load/Merge a model from a JSON file or a remote platform
 - Merge some Kevoree Std Libraries
 - Merge libraries from your own repositories
 - Add `include` statements to the KevScript editor and run it

Upon TypeDefinition addition, you will see the left panel being populated with items:  

![KWE Tdefs list](http://hosta.braindead.fr/raw/5399967d1a9879c239a1a224)  

This list has been created using the KevScript method with the following script:  
```kevs
include npm:kevoree-node-javascript:latest
include npm:kevoree-group-websocket:latest
include mvn:org.kevoree.library.java:org.kevoree.library.java.javaNode:latest
include mvn:org.kevoree.library.java:org.kevoree.library.java.ws:latest
```

#### Add instances to your model
To add instances to your model, you have multiple choices:
 - drag'n'drop an item from the TypeDefinition list (left panel) to the model editor canvas (center)
 - add `add` statements to the KevScript editor and run it

By doing so, KWE will create an instance of the selected TypeDefinition (graphical method: using its latest available version, kevscript method: using the version you have specified).

Using the previous KevScript example (for TypeDefinition), we could do:  
```kevs
include npm:kevoree-node-javascript:latest
include npm:kevoree-group-websocket:latest
include mvn:org.kevoree.library.java:org.kevoree.library.java.javaNode:latest
include mvn:org.kevoree.library.java:org.kevoree.library.java.ws:latest

add node0 : JavascriptNode
add node1 : JavaNode
```  
We have added two `add` statements, one for `node0 : Javascript` and one for `node1 : JavaNode`. This will result in the addition of two nodes in the model editor canvas:

![KWE add instances](http://hosta.braindead.fr/raw/539998931a9879c239a1a225)

### Known protocols
#### Kevoree groups WebSocket protocol
Kevoree uses Groups to share models between Node platforms. Each group has there own implementation and therefore uses its own protocol. In order to communicate with the groups, KWE uses the built-in Javascript WebSocket implementation available in modern Web browsers. Thus, your running Kevoree platform must have a compatible WebSocket group in order to communicate with KWE.

## How do I contribute ?
TODO