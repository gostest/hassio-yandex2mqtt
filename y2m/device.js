const debug = require('debug')('y2m.device');

// При сохранении конфигурации HA сохраняет её в Latin1, кодируя все все русские символы в виде, например:
// Комната -> \u041a\u043e\u043c\u043d\u0430\u0442\u0430
// Делаем воркэраунд, декодируя UTF-8
function fixEncoding(str) {
  if (str) {
    str = `${str}`;
    if (str.includes('"')) //
    {
      return str;
    }
    return eval(`"${str}"`);
  }
}

function convertValue(valueMapping, val) {
  let mqttVal;
  if (!valueMapping) valueMapping="default"
  if (global.valueMappings[valueMapping]) {
    debug('Using value mapping: %s', valueMapping);
    mqttVal = global.valueMappings[valueMapping][val];
    debug('Value mapped: %s -> %s', val, mqttVal);
  } else {
    if (valueMapping) {
      debug(`Config error: unknown value mapping: ${valueMapping}`);
    }
    mqttVal = `${val}`;
  }
  return mqttVal;
}

function convertYandexValueToString(val, capabilityType, instance) {
  switch (instance) {
//        case 'on':
//            return val? "true": "false";
    default:
      return val;
  }
}

function convertToYandexValue(val, type, instance) {
  if (type.startsWith('devices.capabilities.')) {
    const capType = type.slice(21);
    switch (capType) {
      case 'on_off': {
        if (val == null) return false;
        val = `${val}`;
        switch (val.toLowerCase()) {
          case 'true':
          case 'ON':
          case '1':
            return true;
          default:
            return false;
        }
      }
      case 'range': {
        if (val == null) return 0.0;
        try {
          return parseFloat(val);
        } catch (err) {
          debug(`Cannot parse the range state value: ${val}`);
          return 0.0;
        }
      }
      case 'color_setting': {
        return val;
      }
      case 'mode': {
        return val;
      }
      case 'toggle': {
        return val;
      }
      default: {
        debug(`Unsupported capability type: ${type}`);
        return val;
      }
    }
  } else if (type.startsWith('devices.properties.')) {
    const propType = type.slice(19);
    switch (propType) {
      case 'float': {
        if (val == null) return 0.0;
        try {
          return parseFloat(val);
        } catch (err) {
          debug(`Cannot parse the float value: ${val}`);
          return 0.0;
        }
      }
      default: {
        debug(`Unsupported property type: ${type}`);
        return val;
      }
    }
  }
}

class device {
  constructor(options) {
    const id = global.devices.length;
    this.data = {
      id: String(id),
      name: fixEncoding(options.name) || 'Без названия',
      description: fixEncoding(options.description) || '',
      room: fixEncoding(options.room) || '',
      type: options.type || 'devices.types.light',
      capabilities: options.capabilities,
      properties: options.properties,
      complexState: options.complexState || {},
    };
    this.data.capabilities.forEach((capability) => {
      capability.state = this.initState(capability);
    });
    global.devices.push(this);
  }

  // Returns all capability definitions (to Yandex).
  getDefinition() {
    const definition = {};
    definition.id = this.data.id;
    definition.name = this.data.name;
    definition.description = this.data.description;
    definition.room = this.data.room;
    definition.type = this.data.type;
    definition.capabilities = [];
    this.data.capabilities.forEach((capability) => {
      const capDef = {};
      capDef.type = capability.type;
      capDef.retrievable = capability.retrievable;
      capDef.parameters = capability.parameters;
      definition.capabilities.push(capDef);
    });
    if (this.data.properties) {
      definition.properties = [];
      this.data.properties.forEach((property) => {
        const propDef = {};
        propDef.type = property.type;
        propDef.retrievable = property.retrievable;
        propDef.parameters = property.parameters;
        definition.properties.push(propDef);
      });
    }
    return definition;
  }

  // Returns the current capability states (to Yandex).
  getState() {
    const state = {};
    state.id = this.data.id;
    state.capabilities = [];
    this.data.capabilities.forEach((capability) => {
      const capState = {};
      capState.type = capability.type;
      if (capability.state === undefined) {
        capState.state = this.initState(capability);
      } else {
        capState.state = capability.state;
      }
      state.capabilities.push(capState);
    });
    if (this.data.properties) {
      state.properties = [];
      this.data.properties.forEach((property) => {
        const propState = {};
        propState.type = property.type;
        if (property.state === undefined) {
          propState.state = {};
          propState.state.instance = property.parameters.instance;
          propState.state.value = 0;
        } else {
          propState.state = property.state;
        }
        state.properties.push(propState);
      });
    }
    return state;
  }

  initState(capability) {
    const state = capability.state || {}; // There can be mqtt publish/query topics configured
    const capType = capability.type.slice(21);
    switch (capType) {
      case 'on_off': {
        state.instance = 'on';
        state.value = false;
        break;
      }
      case 'mode': {
        state.instance = capability.parameters.instance;
        state.value = capability.parameters.modes[0].value;
        break;
      }
      case 'range': {
        state.instance = capability.parameters.instance;
        state.value = capability.parameters.range.min;
        break;
      }
      default: {
        debug(`Unsupported capability type: ${capability.type}`);
        break;
      }
    }
    return state;
  }

  findCapability(type) {
    return this.data.capabilities.find(capability => capability.type === type);
  }

  // Кешируем значение, переданное нам Яндексом, и пропихиваем его в MQTT
  setState(type, val, relative) {
    let mqttVal;
    let topic;
    let instance;
    try {
      const capability = this.findCapability(type);
      if (relative) {
        debug(`*** Relative: ${capability.state.value} += ${val}`);
        if (capability.state.value == null) {
          capability.state.value = 50;
        }
        capability.state.value += val;
      } else {
        debug(`*** Absolute: ${capability.state.value} -> ${val}`);
        capability.state.value = val;
      }
      topic = capability.state.publish || false;
      instance = capability.state.instance;
      mqttVal = convertValue(capability.mappingRef, `${val}`);
    } catch (err) {
      topic = false;
      console.log(err);
    }
    if (topic) {
      debug(`MQTT publish: '${mqttVal}' -> ${topic}`);
      this.client.publish(topic, mqttVal, { retain: true });
    }
    return {
      type,
      state: {
        instance,
        action_result: {
          status: 'DONE',
        },
      },
    };
  }

  // eslint-disable-next-line max-len
  // Collects all capability states and construct a complex state that should be sent via MQTT (if required)
  propagateComplexState() {
    const topic = this.data.complexState.publish || false;
    if (topic) {
      const complexState = {};
      this.data.capabilities.forEach((capability) => {
        if (!capability.state.publish) {
          complexState[capability.state.instance] = capability.state.value;
        }
      });
      const complexStateStr = JSON.stringify(complexState);
      debug(`MQTT publish: ${complexStateStr} -> ${topic}`);
      this.client.publish(topic, complexStateStr, { retain: true });
    }
  }

  updateState(type, val) {
    debug(`Updating cached state for device '${this.data.name}' (ID=${this.data.id})`);
    try {
      const capability = this.findCapability(type);
      val = convertValue(capability.mappingRef, val);
      val = convertToYandexValue(val, capability.type, capability.state.instance);
      capability.state.value = val;
      debug(`.. updated cached state for device '${this.data.name}' (ID=${this.data.id}): ${val}`);
    } catch (err) {
      console.log(err);
      console.log(`Cannot update capability state for device='${this.data.name
      }' (ID=${this.data.id}), capability type='${type}'`);
    }
  }

  updateComplexState(complexStateStr) {
    try {
      debug(`-- Parsing: ${complexStateStr}`);
      const complexState = JSON.parse(complexStateStr);
      this.data.capabilities.forEach((capability) => {
        if (!capability.state.query) {
          const val = complexState[capability.state.instance];
          if (val !== undefined) {
            debug(`-- capability[${capability.state.instance}]=${val}`);
            capability.state.value = convertToYandexValue(
              val,
              capability.type,
              capability.state.instance,
            );
          }
        }
      });
      if (this.data.properties) {
        this.data.properties.forEach((property) => {
          const val = complexState[property.parameters.instance];
          if (val !== undefined) {
            debug(`-- property[${property.parameters.instance}]=${val}`);
            property.state = {};
            property.state.instance = property.parameters.instance;
            property.state.value = convertToYandexValue(
              val,
              property.type,
              property.state.instance,
            );
          }
        });
      }
    } catch (err) {
      debug(`Cannot parse the complex state string "${complexStateStr}": ${err}`);
    }
  }
}

module.exports = device;
