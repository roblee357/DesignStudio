/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Wed Apr 14 2021 10:39:10 GMT-0500 (Central Daylight Time).
 */

define(['jointjs', 'css!./styles/SimSMWidget.css'], function (joint) {
    'use strict';

    var WIDGET_CLASS = 'sim-s-m';


    function SimSMWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    SimSMWidget.prototype._initialize = function () {
        var first_run = true; // for assigning inital state 
        let init_machineDescriptor = null;  // initialize inital state saver 
        console.log(joint);
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        this._jointSM = new joint.dia.Graph;
        this._jointPaper = new joint.dia.Paper({
            el: this._el,
            width : width,
            height: height,
            model: this._jointSM,
            interactive: false

        
        });

        // add event calls to elements
        this._jointPaper.on('element:pointerdblclick', function(elementView) {
            const currentElement = elementView.model;
            // console.log(currentElement);
            if (self._webgmeSM) {
                // console.log(self._webgmeSM.id2state[currentElement.id]);
                self.doubleclickaction();
            }
        });

        // SINGLE CLICK add event calls to elements
        this._jointPaper.on('element:pointerclick', function(elementView) {
            const currentElement = elementView.model;
            // console.log(currentElement);
            if (self._webgmeSM) {
                // console.log(self._webgmeSM.id2state[currentElement.id]);
                self._setCurrentState(self._webgmeSM.id2state[currentElement.id]);
                self._addTokens(self._webgmeSM.id2state[currentElement.id]);
            }
        });

        this._webgmeSM = null;
    };

    SimSMWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    // State Machine manipulating functions called from the controller
    SimSMWidget.prototype.initMachine = function (machineDescriptor) {
        // Save an instance of the initial machine description for resetting.
        if (this.first_run){
            let init_machineDescriptor = Object.assign({}, machineDescriptor);
            this.first_run = false;
        }

        const self = this;
        console.log(machineDescriptor);

        self._webgmeSM = machineDescriptor;
        self._webgmeSM.current = self._webgmeSM.init;
        self._jointSM.clear();
        const sm = self._webgmeSM;
        sm.id2state = {}; // this dictionary will connect the on-screen id to the state id
        // first add the states
        Object.keys(sm.states).forEach(stateId => {
            let vertex = null;
            let vertex_disk = null;
            let vertex_disks = [];
            if (sm.init === stateId) {
                vertex = new joint.shapes.standard.Circle({
                    position: sm.states[stateId].position,
                    size: { width: 30, height: 30 },
                    attrs: {
                        body: {
                            fill: '#ffffff',
                            cursor: 'pointer'
                        }
                    }
                });
            } else if (sm.states[stateId].isEnd) {
                vertex = new joint.shapes.standard.Circle({
                    position: sm.states[stateId].position,
                    size: { width: 30, height: 30 },
                    attrs: {
                        body: {
                            fill: '#999999',
                            cursor: 'pointer'
                        }
                    }
                });
            } else {
                if (sm.states[stateId].place){
                    
                vertex = new joint.shapes.standard.Circle({
                    position: sm.states[stateId].position,
                    //tokens: sm.states[stateId].tokens,
                    size: { width: 60, height: 60 },
                    attrs: {
                        label : {
                            text: sm.states[stateId].tokens,
                            //event: 'element:label:pointerdown',
                            fontWeight: 'bold',
                            //cursor: 'text',
                            //style: {
                            //    userSelect: 'text'
                            //}
                        },
                        body: {
                            strokeWidth: 3,
                            // fill: '#8de653',
                            cursor: 'pointer'
                        }
                    }
                });
            // Draw little baby cirlces or 'disks' inside the big momma circle or 'place'.
            var token_count2 = sm.states[stateId].tokens;

            for (i = 0; i < token_count2; i++) {
                const pos = sm.states[stateId].position
                const xadj = Math.cos(i/token_count2 * 2 * Math.PI) * 20 + 28;
                const yadj = Math.sin(i/token_count2 * 2 * Math.PI) * 20 + 28;
                pos.x += xadj;
                pos.y += yadj;
                console.log(pos.x,pos.y,sm.states[stateId].position.x,sm.states[stateId].position.y);

                vertex_disk = new joint.shapes.standard.Circle({
                    position: pos,
                    //tokens: sm.states[stateId].tokens,
                    size: { width: 3, height: 3 },
                    attrs: {
                        body: {
                            strokeWidth: 3,
                            fill: '#999999',
                            cursor: 'pointer'
                        }
                    }
                });
                pos.x -= xadj;
                pos.y -= yadj;
                vertex_disks.push(vertex_disk);
              }
            
            } else {
                vertex = new joint.shapes.standard.Rectangle({
                    position: sm.states[stateId].position,
                    size: { width: 60, height: 60 },
                    attrs: {
                        label : {
                            text: sm.states[stateId].name,
                            //event: 'element:label:pointerdown',
                            fontWeight: 'bold',
                            //cursor: 'text',
                            //style: {
                            //    userSelect: 'text'
                            //}
                        },
                        body: {
                            strokeWidth: 1,
                            cursor: 'pointer'
                        }
                    }
                });
            }
            }
            vertex.addTo(self._jointSM);
            sm.states[stateId].joint = vertex;
            sm.id2state[vertex.id] = stateId;
            vertex_disks.forEach(myFunction);

            function myFunction(vertex_disk) {
            vertex_disk.addTo(self._jointSM);
            }

        });

        // then create the links
        Object.keys(sm.states).forEach(stateId => {
            const state = sm.states[stateId];
            Object.keys(state.next).forEach(event => {
                state.jointNext = state.jointNext || {};
                const link = new joint.shapes.standard.Link({
                    source: {id: state.joint.id},
                    target: {id: sm.states[state.next[event]].joint.id},
                    attrs: {
                        line: {
                            strokeWidth: 2
                        },
                        wrapper: {
                            cursor: 'default'
                        }
                    },
                    labels: [{
                        position: {
                            distance: 0.5,
                            offset: 0,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true
                            }
                        },
                        attrs: {
                            text: {
                               // text: event,
                                fontWeight: 'bold'
                            }
                        }
                    }]
                });
                link.addTo(self._jointSM);
                state.jointNext[event] = link;
            })
        });

        //now refresh the visualization
        self._jointPaper.updateViews();
        self._decorateMachine();
    };

    SimSMWidget.prototype.destroyMachine = function () {

    };

    SimSMWidget.prototype.fireEvent = function (event) {
        const self = this;
        const current = self._webgmeSM.states[self._webgmeSM.current];
        const link = current.jointNext[event];
        const linkView = link.findView(self._jointPaper);
        linkView.sendToken(joint.V('circle', { r: 10, fill: 'black' }), {duration:500}, function() {
           self._webgmeSM.current = current.next[event];
           self._decorateMachine();
        });


    };

    SimSMWidget.prototype.resetMachine = function () {
        // this._webgmeSM.current = this._webgmeSM.init;
        this._decorateMachine();
        this.initMachine(this.init_machineDescriptor);
    };

    SimSMWidget.prototype._decorateMachine = function() {
        const sm = this._webgmeSM;
        Object.keys(sm.states).forEach(stateId => {
            
            sm.states[stateId].joint.attr('body/stroke', '#333333');
            sm.states[stateId].joint.attr('label/text', sm.states[stateId].tokens);
           // console.log("decoration fireable:", sm.states[stateId].fireable, sm.states[stateId].name);
            if (sm.states[stateId].fireable && !sm.states[stateId].place){
            sm.states[stateId].joint.attr('body/stroke', 'blue');
            }
    });
        sm.setFireableEvents(Object.keys(sm.states[sm.current].next));
    };

    SimSMWidget.prototype._setCurrentState = function(newCurrent) {
        this._webgmeSM.current = newCurrent;
        this._decorateMachine();
    };


    SimSMWidget.prototype.doubleclickaction = function(newCurrent){
        this.initMachine(this._webgmeSM);
    };
    
    
    SimSMWidget.prototype._addTokens = function(newCurrent) {
        const sm = this._webgmeSM;
        

        if (!sm.states[sm.current].place){
        // console.log( sm.current, sm.states[sm.current].input);
        const inputPlaces = sm.states[sm.current].input;
        var fireable_test = true;
        for (const [key, value] of Object.entries(inputPlaces)) {
            // console.log(`${key}: ${value}`, sm.states[value].tokens);
            if (sm.states[value].tokens == 0) {fireable_test = false }
          };
          console.log("fireable:",fireable_test)
        
        if (fireable_test){
            const outputPlaces = sm.states[sm.current].next;
            for (const [key, value] of Object.entries(outputPlaces)) {
                sm.states[value].tokens = sm.states[value].tokens + 1;
                sm.states[sm.current].fireable = true;
                // console.log("outputs",`${key}: ${value}`, sm.states[value].tokens);
              };  
            for (const [key, value] of Object.entries(inputPlaces)) {
                console.log("inputs",`${key}: ${value}`, sm.states[value].tokens);
                sm.states[value].tokens = sm.states[value].tokens - 1;
                if (sm.states[value].tokens < 1){sm.states[sm.current].fireable = false}
              };              
            this._decorateMachine();
            this.initMachine(this._webgmeSM);
        };
    };

    if (sm.states[sm.current].place){
        sm.states[sm.current].tokens = sm.states[sm.current].tokens + 1;
        console.log("sm.states[sm.current].tokens:",sm.states[sm.current].tokens);
            this._decorateMachine();
    };
    };


    /* * * * * * * * Visualizer event handlers * * * * * * * */

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    SimSMWidget.prototype.destroy = function () {
    };

    SimSMWidget.prototype.onActivate = function () {
        this._logger.debug('SimSMWidget has been activated');
    };

    SimSMWidget.prototype.onDeactivate = function () {
        this._logger.debug('SimSMWidget has been deactivated');
    };

    return SimSMWidget;
});
