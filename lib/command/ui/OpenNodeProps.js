var AbstractCommand     = require('../AbstractCommand'),
    AddDictionary       = require('../model/AddDictionary'),
    AddNodeNetwork      = require('../model/AddNodeNetwork'),
//    AddNodeLink         = require('../model/AddNodeLink'),
    CloseModal          = require('./CloseModal'),
    InstancePropsHelper = require('../../util/InstancePropsHelper');

/**
 * Created by leiko on 27/01/14.
 */
var OpenNodeProps = AbstractCommand.extend({
    toString: 'OpenNodeProps',
    
    construct: function (editor, ui) {
        this.ui = ui;
        this.closeModalCmd = new CloseModal();
        this.addDicCmd = new AddDictionary(editor);
        this.addNodeNetCmd = new AddNodeNetwork(editor);
//        this.addNodeLinkCmd = new AddNodeLink(editor);
    },

    execute: function (instance) {
        // add dictionary if none found
        if (!instance.dictionary) this.addDicCmd.execute(instance);

        // compute networkProperties
        function computeNetProps() {
            var netProps = [];
            var nets = this.editor.getModel().nodeNetworks.iterator();
            var count = 0;
            while (nets.hasNext()) {
                var net = nets.next();
                if (net.target.name === instance.name) {
                    // this nodeNetwork is targeting this instance
                    // TODO handle initBy nodes
                    var links = net.link.iterator();
                    while (links.hasNext()) {
                        var link = links.next();
                        var values = [];
                        for (var k=0; k < link.networkProperties.size(); k++) {
                            var val = link.networkProperties.get(k);
                            values.push({
                                selected: (k===0) ? 'ui-selected' : null,
                                name: val.name,
                                value: val.value
                            });
                        }
                        netProps.push({
                            id:     link.generated_KMF_ID,
                            active: (count===0) ? 'active' : null,
                            type:   link.networkType,
                            rate:   link.estimatedRate,
                            values: values
                        });
                    }
                    count++;
                }
            }
            return netProps;
        }
        var netProps = computeNetProps.bind(this)();
        if (netProps.length === 0) {
            // we add a default nodeNetwork 
            this.addNodeNetCmd.execute(instance);
            netProps = computeNetProps.bind(this)();
        }

        // compute group links
        var groups = [];
        var grps = instance.groups.iterator();
        while (grps.hasNext()) groups.push(grps.next().name);
        
        var data = {
            name:           instance.name,
            versions:       InstancePropsHelper.getVersionsData(instance, this.editor.getModel()),
            dictionary:     InstancePropsHelper.getDictionaryData(instance),
            groupsDisabled: instance.groups.size() === 0,
            groups:         groups,
            hasNetProps:    netProps.length > 0,
            netProps:       netProps
        };
        
        console.log('data', data);
        
        $('#modal-content').html(EditorTemplates['node-properties'].render(data, {
            instanceProps: EditorTemplates['instance-props-partial']
        }));
        
//        if (data.netProps.length === 1) $('#del-node-link').prop('disabled', 'disabled');
//        for (var i in data.netProps) {
//            if (data.netProps[i].values.length === 1) {
//                var netPropsDelBtn = $(document.getElementById('del-net-prop-'+data.netProps[i].id));
//                netPropsDelBtn.prop('disabled', 'disabled');
//            }
//        }
        
        $('.net-prop-pairs').selectable();
        
        $('#net-props-heading').on('click', function () {
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

//        $('#del-node-link').on('click', function () {
//            console.log('DEL NODE LINK');
//        });
//
//        $('#add-node-link').on('click', function () {
//            console.log('ADD NODE LINK');
//            this.addNodeLinkCmd.execute();
//        }.bind(this));
        
//        for (var i in data.netProps) {
//            var netPropsDelBtn = $(document.getElementById('del-net-prop-'+data.netProps[i].id));
//            netPropsDelBtn.on('click', function () {
//                console.log('DEL NET PROP', data.netProps[i].id);
//            });
//            var netPropsAddBtn = $(document.getElementById('add-net-prop-'+data.netProps[i].id));
//            netPropsAddBtn.on('click', function () {
//                console.log('ADD NET PROP', data.netProps[i].id);
//            });
//        }
        
        $('#modal-save').off('click');
        $('#modal-save').on('click', function () {
            var name = $('#instance-name').val();
            if (instance.name !== name) instance.name = name;

            // save dictionary
            InstancePropsHelper.saveDictionary(instance, this.editor, data.dictionary);
            
            // save network
            // TODO for now I have disabled add/del for node link and net props, but we should re-enable them and handle them properly
            var nets = this.editor.getModel().nodeNetworks.iterator();
            while (nets.hasNext()) {
                var net = nets.next();
                if (net.target.name === instance.name) {
                    var links = net.link.iterator();
                    while (links.hasNext()) {
                        var link = links.next();
                        var netType = $(document.getElementById('link-type-'+link.generated_KMF_ID)).val();
                        var rate = $(document.getElementById('link-rate-'+link.generated_KMF_ID)).val();
                        if (netType.length > 0 && link.networkType !== netType) link.networkType = netType;
                        if (rate.length > 0 && link.estimatedRate !== rate) link.estimatedRate = rate;
                        
                        for (var k=0; k < link.networkProperties.size(); k++) {
                            var prop = link.networkProperties.get(k);
                            var name = $(document.getElementById('net-prop-name-'+link.generated_KMF_ID)).val();
                            var value = $(document.getElementById('net-prop-value-'+link.generated_KMF_ID)).val();
                            if (name.length > 0 && prop.name !== name) prop.name = name;
                            if (value.length > 0 && prop.value !== value) prop.value = value;
                        }
                    }
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

module.exports = OpenNodeProps;
