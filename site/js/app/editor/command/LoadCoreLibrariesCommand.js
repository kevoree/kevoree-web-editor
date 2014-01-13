define(
  [
    'jquery',
    'templates/corelib-items',
    'util/Config'
  ],

  function ($, corelibTemplate, Config) {
    function LoadCoreLibrariesCommand() {}

    /**
     * Called when "Load core libraries" popup shows up
     * @param editor current editor object
     * @param filter [optional] string representing filter option ('all' | 'latest')
     */
    LoadCoreLibrariesCommand.prototype.execute = function (editor, filter) {
      // retrieve the current selected tab in the popup
      var platform = $('[id^=corelib-].active').attr('id').split('-')[1];

      // show loading message
      $('#corelib-'+platform).html('<div class="well"><p><img src="img/ajax-loader-small.gif" alt="Loading"/> Please wait while '
        + platform.charAt(0).toUpperCase()
        + platform.slice(1)
        + ' libraries are loading...</p></div>');
      // retrieve lib list from server
      var host = $('#remote-server-host').val() || Config.REMOTE_HOST;
      var port = $('#remote-server-port').val() || Config.REMOTE_PORT;
      $.ajax({
        url: 'http://'+host+':'+port+'/'+Config.REMOTE_LOAD,
        timeout: 30000, // 30 seconds timeout
        data: { platform: platform },
        dataType: 'jsonp',
        success: function (data) {
          switch (data.result) {
            case 1:
              // load libraries
              editor.addLibraries(platform, data.libraries);
              $('#corelib-'+platform).html(
                corelibTemplate({
                  platform: platform,
                  items: data.libraries,
                  filter: filter
                })
              );
              // register listener to enable/disable Load button
              $('.corelib-item').off('click');
              $('.corelib-item').on('click', function () {
                if ($(this).prop('checked') == true) {
                  // if there is at least one item selected = enable button
                  $('#load-corelib').removeClass('disabled');
                } else {
                  if ($('.corelib-item:checked').size() == 0) {
                    // no item are checked = disable button
                    $('#load-corelib').addClass('disabled');
                  }
                }
              });

              // register listener for 'select all' checkbox
              $('#corelib-selectall-'+platform).off('click');
              $('#corelib-selectall-'+platform).on('click', function () {
                if ($(this).prop('checked')) {
                  $('.corelib-item[data-library-platform='+platform+']').prop('checked', true);
                  $('#load-corelib').removeClass('disabled');
                } else {
                  $('.corelib-item[data-library-platform='+platform+']').prop('checked', false);
                  if ($('.corelib-item:checked').size() == 0) {
                    $('#load-corelib').addClass('disabled');
                  }
                }
              });
              break;

            default:
              console.log(platform+" libraries load error", data.message);
              $('#corelib-'+platform).html('<div class="well"><p>Something went wrong while loading libraries :-(<br/><strong>Error:</strong> '+data.message+'</p></div>');
              break;
          }
        },
        error: function (err) {
          // fail
          console.log(platform+" libraries load error", err);
          $('#corelib-'+platform).html('<p>Something went wrong while loading libraries :-(</p>');
        }
      });
    }

    return LoadCoreLibrariesCommand;
  }
);