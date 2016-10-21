(function (D, window, undefined) {
    'use strict';
    var sensorList = D.getElementById('sensorList');
    var logList = D.getElementById('logList');
    var sensorAdded = false;

    function isValidJson(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return false;
        }
    }

    function addElement(parent, type, classN, id, texts) {
        var el = D.createElement(type);
        el.className = classN;
        el.id = id;
        if(texts) {
            el.appendChild(D.createTextNode(texts));
        }
        parent.appendChild(el);
        return el;
    }

    function setNewButtons(data) {
        //setButtons = true;
        //Object.keys(data).forEach(function (button) {
        //    var counter = addElement(clicks, 'span', 'clicker', button + 'click', button + ': ');
        //    var numb = addElement(counter, 'span', 'buttonpress', button, data[button].clicks);
        //    addElement(counter, 'small', 'nclicks', button + 'number', ' clicks');
        //    clickButtons[button] = {};
        //    clickButtons[button].counter = numb;
        //    clickButtons[button].clicks = counter;
        //});
    }

    function setNewLeds(data) {
        //setLeds = true;
        //Object.keys(data).forEach(function (id) {
        //    var stat = data[id].status;
        //    var statv = data[id].value;
        //    var onoffstat = (statv === 1) ? 'off' : 'on';
        //    var blinkstat = (stat !== 'blinking') ? (stat !== 'stop') ? 'blink' : 'blink' : 'stop'; 
        //    var p = addElement(main, 'p', 'led', id + 'p', '');
        //    var lhead = addElement(p, 'h3', 'ledheader', id + 'h3', id);
        //    var onled = addElement(p, 'input', 'timer', id + 'on', '');
        //    var offled = addElement(p, 'input', 'timer', id + 'off', '');
        //    var ledswitch = addElement(p, 'button', 'button', id + 'b', onoffstat);
        //    var ledblink = addElement(p, 'button', 'button', id + 'blink', blinkstat);
        //    ledswitch.style.background = (onoffstat === 'on') ? '#27ae60' : '#2ecc71';
        //    ledblink.style.background = (blinkstat === 'blink') ? '#1abc9c' : '#16a085';
        //    onled.type = 'number';
        //    offled.type = 'number';
        //    onled.value = 100;
        //    offled.value = 100;
        //    leds[id] =  {
        //        on: onled,
        //        off: offled
        //    };
        //    ledbuttons[id] = {
        //        switch: ledswitch,
        //        blink: ledblink
        //    };
        //    ledbuttons[id].switch.onclick = onoffclick;
        //    ledbuttons[id].blink.onclick = blinkclick;
        //});
    }

    function blinkclick(event) {
        //var name = event.target.id.replace('blink', '');
        //if (event.target.innerText !== 'stop') {
        //    var obj = {
        //        led: name,
        //        on: leds[name].on.value,
        //        off: leds[name].off.value,
        //        count: count.value
        //    };
        //    webSocketConnection.send(JSON.stringify(obj));
        //} else {
            //webSocketConnection.send(JSON.stringify({ led: name, stop: 1 }));
        //}
    }

    function onoffclick(event) {
        //webSocketConnection.send(JSON.stringify({ led: event.target.id.replace('b', ''), value: (event.target.innerText === 'on') ? 1 : 0 }));
    }

    var webSocketConnection = Object.create({
        init: function () {
            var self = this;
            this.connection = new WebSocket(window.location.origin.replace('http', 'ws'));

            this.connection.onopen = function () {
                console.log('WebSocket: connected');
            };

            this.connection.onerror = function (error) {
                console.log(error);
                self.connection.close();
                setTimeout(self.init, 1000);
            };

            this.connection.onclose = function () {
                console.log('WebSocket: disconnected');
                setTimeout(self.init, 1000);
            };

            this.connection.onmessage = function (message) {
                var json = isValidJson(message.data);
                if (json) {
                    if(json.type === 'sensors') {
                        Object.keys(json.data).forEach(function(sensor) {
                            //    var counter = addElement(clicks, 'span', 'clicker', button + 'click', button + ': ');
                            //    var numb = addElement(counter, 'span', 'buttonpress', button, data[button].clicks);
                            //    addElement(counter, 'small', 'nclicks', button + 'number', ' clicks');
                            //    clickButtons[button] = {};
                            //    clickButtons[button].counter = numb;
                            //    clickButtons[button].clicks = counter;
                            var sensorName = json.data[sensor].name;
                            var sensorState = json.data[sensor].state;
                            if(!sensorAdded) {
                                sensorAdded = true;
                                var li = addElement(sensorList, 'li', 'sensor', sensor);
                                var btn = addElement(li, 'button', '', sensor + '-button');
                                addElement(btn, 'i', 'fa fa-fw fa-home fa-5x', sensor + '-home-icon');
                                addElement(btn, 'p', '', sensor + '-text', sensorName + ' is ' + sensorState)
                            } else {
                                var btn = D.getElementById(sensor + '-button');
                                //$(btn).removeClass((sensorState === 'open' ? 'btn-success btn-info' : 'btn-danger btn-info')).addClass((sensorState === 'open' ? 'btn-danger' : sensorState === 'closed' ? 'btn-success' : 'btn-info'));
                                var stateText = D.getElementById(sensor + '-text');
                                stateText.innerText = sensorName + ' is ' + sensorState;
                            }
                            var logLi = addElement(logList, 'li', 'sensor-log', sensor + '-log');
                            addElement(logLi, 'span', 'sensor-state-occurred', sensor + 'state-occurred', '[' + new Date(json.data[sensor].occurred).toLocaleString() + ']');
                            addElement(logLi, 'span', 'sensor-name', sensor + 'name', ' ' + sensorName + ' is ');
                            addElement(logLi, 'span', 'sensor-state', sensor + 'state', sensorState);
                        });
                    } else if(json.type === 'relays') {
                        Object.keys(json.data).forEach(function(relay) {
                            var sensorObj = D.getElementById(json.data[relay].sensorId + '-text');
                            //var span = addElement(sensorObj, 'p', 'relay', relay, json.data[relay].name);
                        });
                    }
                //    if (!setLeds && json.type === 'leds') {
                //        return setNewLeds(json.data);
                //    } else if (!setButtons && json.type === 'buttons') {
                //        return setNewButtons(json.data);
                //    }
                //     if (json.type === 'leds') {
                //        Object.keys(json.data).forEach(function (led) {
                //            var stat = json.data[led].status;
                //            var b = (stat === 'blinking' || stat === 'stop') ? ledbuttons[led].blink : ledbuttons[led].switch;
                //            b.style.background = (stat !== 'off') ? (stat !== 'on') ? (stat === 'stop') ? '#1abc9c' : '#16a085' : '#2ecc71' : '#27ae60';
                //            b.innerText = (stat !== 'stop') ? (stat !== 'blinking') ? (stat === 'on') ? 'off' : 'on' : 'stop' : 'blink';
                //         });
                //     } else if (json.type === 'buttons') {
                //        Object.keys(json.data).forEach(function (button) {
                //           var but = clickButtons[button];
                //            if (but.sT) {
                //                clearTimeout(but.sT);
                //            }
                //            but.counter.innerText = json.data[button].clicks;
                //            but.clicks.style.color = '#e74c3c';
                //            but.sT = setTimeout(function () {
                //                but.clicks.style.color = '#aaa';
                //            }, 2000);
                //        })
                //     }
                }
            };
        },
        send: function (data) {
            //this.connection.send(data);
        },
        close: function () {
            //this.connection.close();
        }
    });
    webSocketConnection.init();

}(document, window));