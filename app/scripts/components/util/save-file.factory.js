'use strict';

angular.module('editorApp')
    .factory('saveFile', function () {
        return {
            /**
             *
             * @param data data to put into file
             * @param filename file name without extension (null will use current time in milliseconds)
             * @param ext file extension starting with a dot (ie. ".json")
             * @param type file mimetype (if none given: "text/plain")
             */
            save: function (data, filename, ext, type) {
                filename = filename || 'model'+(Math.floor(Math.random() * (1000 - 100)) + 100);
                ext = ext || '.txt';
                type = type || 'text/plain';

                var kevsAsBlob = new Blob([data], { type: type });

                var downloadLink = document.createElement('a');
                downloadLink.download = filename + ext;
                downloadLink.innerHTML = 'Download File';
                if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                    // Chrome allows the link to be clicked
                    // without actually adding it to the DOM.
                    downloadLink.href = URL.createObjectURL(kevsAsBlob);
                } else {
                    // Firefox requires the link to be added to the DOM
                    // before it can be clicked.
                    downloadLink.href = URL.createObjectURL(kevsAsBlob);
                    downloadLink.onclick = function (e) {
                        document.body.removeChild(e.target);
                    };
                    downloadLink.style.display = 'none';
                    document.body.appendChild(downloadLink);
                }

                downloadLink.click();
            }
        };
    });
