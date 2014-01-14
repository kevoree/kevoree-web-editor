define(
  [
    'util/AlertPopupHelper',
    'lib/kevoree-kevscript',
    'lib/kevoree',
    'resolver/NPMResolver',
    'resolver/MVNResolver'
  ],

  function (AlertPopupHelper, KevScript, Kevoree, NPMResolver, MVNResolver) {
    var NAMESPACE = '.kevscript-editor'

    function RunKevScriptCommand() {}

    RunKevScriptCommand.prototype.execute = function (editor, script) {
      $('body').off(NAMESPACE)
      $('body').on('hidden'+NAMESPACE, '#kevs-editor', function () {
        $('#kevs-editor-error-content').html("");
        $('#kevs-editor-error').addClass('hide');
      });

      var options = {
        resolvers: {
          npm: new NPMResolver(),
          mvn: new MVNResolver()
        }
      }

      var kevs = new KevScript(options);
      kevs.parse(script, editor.getModel(), function (err, model) {
        if (err) {
          $('#kevs-editor-error').removeClass('hide');
          $('#kevs-editor-error').addClass('in');
          $('#kevs-editor-error-content').html(err.message);
        } else {
          var serializer = new Kevoree.org.kevoree.serializer.JSONModelSerializer();
          var loader = new Kevoree.org.kevoree.loader.JSONModelLoader();
          editor.setModel(loader.loadModelFromString(serializer.serialize(model)).get(0));

          $('#kevs-editor').modal('hide');
        }
      });
    }

    return RunKevScriptCommand;
  }
);