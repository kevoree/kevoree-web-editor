define(
  [
    'jquery',
    'lib/kevoree',
    'util/AlertPopupHelper'
  ],
  function ($, Kevoree, AlertPopupHelper) {
    
    function SaveCommand () {}

    SaveCommand.prototype.execute = function (type, editor) {
      if (editor.getModel()) {
        try {
          var serializer = new Kevoree.org.kevoree.serializer.JSONModelSerializer();
          var mimetype = 'application/json';
          switch (type) {
            default:
              break;
            
            case 'xmi':
              serializer = new Kevoree.org.kevoree.serializer.XMIModelSerializer();
              mimetype = 'application/vnd.xmi+xml';
              break;
          }
          var jsonModel = JSON.stringify(JSON.parse(serializer.serialize(editor.getModel())), null, 4);

          var modelAsBlob = new Blob([jsonModel], {type: mimetype});
          var modelName = $('#model-name').val();
          if (modelName.length === 0) {
            modelName = Date.now()+'.'+type;
          } else if (modelName.indexOf('.') === -1) {
            modelName = modelName+'.'+type;
          }

          var downloadLink = document.createElement("a");
          downloadLink.download = modelName;
          downloadLink.innerHTML = "Download File";
          if (window.webkitURL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(modelAsBlob);
          } else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(modelAsBlob);
            downloadLink.onclick = function (e) {
              document.body.removeChild(e.target)
            };
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
          }

          downloadLink.click();
          
        } catch (err) {
          AlertPopupHelper.setType(AlertPopupHelper.ERROR);
          AlertPopupHelper.setHTML('Unable to save current model as '+type+'.<br/><b>Error: </b>'+err.message);
          AlertPopupHelper.show(5000);
          console.log("SaveCommand ERROR: "+err.message, editor.getModel());
        }
      } else {
        AlertPopupHelper.setType(AlertPopupHelper.WARN);
        AlertPopupHelper.setText("There is no model to save currently.");
        AlertPopupHelper.show(2000);
      }
    }

    return SaveCommand;
  }
);