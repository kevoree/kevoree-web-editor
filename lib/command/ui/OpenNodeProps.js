var AbstractCommand     = require('../AbstractCommand'),
    AddDictionary       = require('../model/AddDictionary'),
    AddNetworkInfo      = require('../model/AddNetworkInfo'),
    AddNetworkProperty  = require('../model/AddNetworkProperty'),
    AddFragDictionary   = require('../model/AddFragDictionary'),
    AddDictionaryValue  = require('../model/AddDictionaryValue'),
    Pull                = require('../network/Pull'),
    Push                = require('../network/Push'),
    SetModel            = require('../editor/SetModel'),
    CloseModal          = require('./CloseModal'),
    Alert               = require('../../util/Alert'),
    InstancePropsHelper = require('../../util/InstancePropsHelper'),
    processPath         = require('../../util/process-path');

/**
 * Created by leiko on 27/01/14.
 */
var OpenNodeProps = AbstractCommand.extend({
    toString: 'OpenNodeProps',

    construct: function (editor, ui) {
        this.ui = ui;
        this.closeModalCmd = new CloseModal();
        this.addDicCmd = new AddDictionary(editor);
        this.addNetworkInfoCmd = new AddNetworkInfo(editor);
        this.addNetPropCmd = new AddNetworkProperty(editor);
        this.addFragDicCmd = new AddFragDictionary(editor);
        this.addDicValCmd = new AddDictionaryValue(editor);
        this.pullCmd = new Pull(editor);
        this.pushCmd = new Push(editor);
        this.setModelCmd = new SetModel(editor);
    },

    execute: function (instance) {
        // add dictionary if none found
        if (!instance.dictionary) this.addDicCmd.execute(instance);

        // compute networkProperties
        function computeNetProps() {
            var netInfos = [];
            var nets = instance.networkInformation.iterator();
            var count = 0;
            while (nets.hasNext()) {
                var net = nets.next();
                var values = [];
                for (var i=0; i<net.values.size(); i++) {
                    var val = net.values.get(i);
                    values.push({
                        first: (i===0),
                        name:  val.name,
                        value: val.value
                    });
                }
                netInfos.push({
                    first:   (count===0),
                    netName: net.name,
                    values:  values
                });
                count++;
            }
            return netInfos;
        }
        var netInfos = computeNetProps.bind(this)();
        if (netInfos.length === 0) {
            // if there is no NetworkInfo we add a default one 
            var net = this.addNetworkInfoCmd.execute(instance, 'lan');
            var prop = this.addNetPropCmd.execute(net, 'ip', '127.0.0.1');
            netInfos = computeNetProps.bind(this)();
        }

        // compute group links
        var groups = [];
        var grps = instance.groups.iterator();
        while (grps.hasNext()) groups.push(grps.next().name);

        var data = {
            name:           instance.name,
            started:        instance.started,
            versions:       InstancePropsHelper.getVersionsData(instance, this.editor.getModel()),
            dictionary:     InstancePropsHelper.getDictionaryData(instance),
            groupsDisabled: instance.groups.size() === 0,
            groups:         groups,
            netInfos:       netInfos
        };

        $('#modal-content').html(EditorTemplates['node-properties'].render(data, {
            instanceProps: EditorTemplates['instance-props-partial']
        }));

        $('.net-prop-pairs').selectable({
            selecting: function(evt, ui) {
                var that = this;

                // Remove all other selected elements
                $(this).find('.ui-selected').each(function() {
                    var selectee = $.data(this, "selectable-item");
                    if (!event.metaKey) {
                        selectee.$element.removeClass('ui-selected');
                        selectee.selected = false;
                        selectee.$element.addClass('ui-unselecting');
                        selectee.unselecting = true;
                        // selectable UNSELECTING callback
                        $(that).data("selectable")._trigger("unselecting", evt, { unselecting: selectee.element});
                    }
                });

                $(this).find('.ui-selecting').each(function() {
                    var selectee = $.data(this, "selectable-item");
                    if (!$(this).is(ui.selecting)) {
                        if ((event.metaKey) && selectee.startselected) {
                            selectee.$element.removeClass('ui-selecting');
                            selectee.selecting = false;
                            selectee.$element.addClass('ui-selected');
                            selectee.selected = true;
                        } else {
                            selectee.$element.removeClass('ui-selecting');
                            selectee.selecting = false;
                            if (selectee.startselected) {
                                selectee.$element.addClass('ui-unselecting');
                                selectee.unselecting = true;
                            }
                            // selectable UNSELECTING callback
                            $(that).data("selectable")._trigger("unselecting", event, {
                                unselecting: selectee.element
                            });
                        }
                    }
                });
            }
        });

        $('#node-net-infos-heading').on('click', function () {
            var icon = $(this).find('span');
            if (icon.hasClass('glyphicon-plus')) {
                icon.removeClass('glyphicon-plus');
                icon.addClass('glyphicon-minus');
            } else {
                icon.removeClass('glyphicon-minus');
                icon.addClass('glyphicon-plus');
            }
        });

        InstancePropsHelper.setVersionChangeListener(instance, this.editor.getModel(), this);

        // add PUSH & PULL listeners
        function retrieveNodeURI() {
            var group = instance.findGroupsByID($('#node-group option:selected').text());
            var port = group.findFragmentDictionaryByID(instance.name).findValuesByID('port');
            var path = group.findFragmentDictionaryByID(instance.name).findValuesByID('path');
            if (path) {
                path = processPath(path.value);
            } else {
                path = '';
            }
            return {
                host: $('.net-info-tab-content.active').find('.net-prop.ui-selected .net-prop-value').val(),
                port: (port) ? port.value : '',
                path: path
            }
        }

        var pushBtn = $('#push-to-node');
        var pullBtn = $('#pull-from-node');
        var groupsSelect = $('#node-group');

        function enableDisablePushPullButtons() {
            // retrieve attached group instance
            var group = instance.findGroupsByID(groupsSelect.find('option:selected').text());
            if (group) {
                // retrieve group instance fragmentDictionary related to this node instance
                var dic = group.findFragmentDictionaryByID(instance.name);
                if (!dic) {
                    // if there is no fragmentDictionary created: do it
                    dic = this.addFragDicCmd.execute(group, instance);
                }

                // retrieve port attribute value from this dictionary
                var port = dic.findValuesByID('port');
                if (port && port.value.length > 0) {
                    // port value is set and seems to be valid: enable buttons
                    pushBtn.attr('disabled', false);
                    pullBtn.attr('disabled', false);
                    return;
                } else {
                    // port value does not seem to be valid: create it with default (if any)
                    var dicType = group.typeDefinition.dictionaryType;
                    if (dicType) {
                        var attr = dicType.findAttributesByID('port');
                        if (attr) {
                            // create new value for "port" with defaultValue
                            this.addDicValCmd.execute(dic, attr.name, attr.defaultValue);

                            // check if port is now properly set
                            port = dic.findValuesByID('port');
                            if (port && port.value.length > 0) {
                                // port value is set and seems to be valid: enable buttons
                                pushBtn.attr('disabled', false);
                                pullBtn.attr('disabled', false);
                                return;
                            }
                        }
                    }
                }
            }
            pushBtn.attr('disabled', true);
            pullBtn.attr('disabled', true);
        }
        enableDisablePushPullButtons.bind(this)();

        // disable/enable PUSH & PULL button according to the presence of the proper fragmentDependant attributes
        groupsSelect.off('change');
        groupsSelect.on('change', enableDisablePushPullButtons.bind(this));

        pushBtn.off('click');
        pushBtn.on('click', function () {
            $('#modal-success, #modal-error').addClass('hide');
            var uri = retrieveNodeURI();
            this.pushCmd.execute(uri.host, uri.port, uri.path, this.editor.getModel(), function (err) {
                if (err) {
                    $('#modal-error').html(err.message);
                    $('#modal-error').removeClass('hide');
                    return;
                }

                $('#modal-success').html('Model pushed successfully to <strong>ws://'+uri.host+':'+uri.port+uri.path+'</strong>');
                $('#modal-success').removeClass('hide');
            });
        }.bind(this));
        
        pullBtn.off('click');
        pullBtn.on('click', function () {
            $('#modal-success, #modal-error').addClass('hide');
            var uri = retrieveNodeURI();
            this.pullCmd.execute(uri.host, uri.port, uri.path, function (err, model) {
                if (err) {
                    $('#modal-error').html(err.message);
                    $('#modal-error').removeClass('hide');
                    return;
                }

                this.setModelCmd.execute(model);
                this.closeModalCmd.execute();
                var alert = new Alert();
                alert.setType('success');
                alert.setHTML('Pull model success', 'ws://'+uri.host+':'+uri.port+uri.path);
                alert.show(3500);
            }.bind(this));
        }.bind(this));

        $('#del-network').on('click', function () {
            var netInfoName = $('.net-info-tab.active').find('a').text();
            var net = instance.findNetworkInformationByID(netInfoName);
            instance.removeNetworkInformation(net);
            this.execute(instance);
            $('#node-net-infos').collapse();
        }.bind(this));

        $('#add-network').on('click', function () {
            var net = this.addNetworkInfoCmd.execute(instance, randomName('tab'));
            this.addNetPropCmd.execute(net, 'propName', '127.0.0.1');
            this.execute(instance);
            $('#node-net-infos').collapse();
        }.bind(this));

        for (var i in data.netInfos) {
            (function (netInfoName) {
                var netPropsDelBtn = $('#del-net-prop-'+netInfoName);
                netPropsDelBtn.off('click');
                netPropsDelBtn.on('click', function () {
                    if ($('.net-prop').size() > 1) {
                        $('.net-prop.ui-selected[data-net-info="'+netInfoName+'"]').each(function () {
                            var net = instance.findNetworkInformationByID(netInfoName);
                            var prop = net.findValuesByID($(this).data().propName);
                            net.removeValues(prop);
                        });
                        this.execute(instance);
                        $('#node-net-infos').collapse();
                    }
                }.bind(this));

                var netPropsAddBtn = $('#add-net-prop-'+netInfoName);
                netPropsAddBtn.off('click');
                netPropsAddBtn.on('click', function () {
                    var net = instance.findNetworkInformationByID(netInfoName);
                    var prop = this.addNetPropCmd.execute(net, randomName('prop'), '127.0.0.1');
                    this.execute(instance);
                    $('#node-net-infos').collapse();
                }.bind(this));
            }.bind(this))(data.netInfos[i].netName);
        }

        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            if (instance.name !== name) instance.name = name;

            // save dictionary
            InstancePropsHelper.saveDictionary(instance, this.editor, data.dictionary);

            // save state
            InstancePropsHelper.saveState(instance);

            // save network
            // TODO for now I have disabled add/del for node link and net props, but we should re-enable them and handle them properly
            for (var i in data.netInfos) {
                var netInfo = data.netInfos[i];
                var netInfoName = $('#net-info-'+netInfo.netName).val();
                var net = instance.findNetworkInformationByID(netInfo.netName);
                if (net.name !== netInfoName) net.name = netInfoName;
                
                for (var j in netInfo.values) {
                    var property = netInfo.values[j];
                    var propName = $('#net-prop-'+netInfo.netName+'-'+netInfo.values[j].name).val();
                    var propVal = $('#net-prop-'+netInfo.netName+'-'+netInfo.values[j].name+'-value').val();
                    var prop = net.findValuesByID(property.name);
                    if (prop.name !== propName) prop.name = propName;
                    if (prop.value !== propVal) prop.value = propVal;
                }
            }

            this.closeModalCmd.execute();
        }.bind(this));

        $('#delete-instance').off('click');
        $('#delete-instance').on('click', function () {
            this.ui.onDelete();
            this.editor.getUI().update();
        }.bind(this));

        $('#modal').modal();
    }
});

function randomName(tag) {
    return tag+parseInt(Math.random()*1000);
}

module.exports = OpenNodeProps;
