import { ModelValidatior } from './models/models';
import validator from "validator";
import * as _ from "lodash"

export function applyValidator(name: string, valueToValidate: any, validator: ModelValidatior) {

  Object.entries(validator).forEach(([key, value]) => {
    if (value !== undefined && value !== false) {
      if (value === true)
        value = {}
      if (value.msg === undefined)
        value.msg = name + ' does not pass the test: ' + key
      let undefinedString: string = name + ' has a type which is not supported for validation ' + key
      switch (key) {
        case 'contains': {
          checkThrow(undefinedString, contains(valueToValidate, value), value.msg)
          break
        }
        case 'equals': {
          checkThrow(undefinedString, equals(valueToValidate, value), value.msg)
          break
        }
        case 'isAlpha': {
          checkThrow(undefinedString, isAlpha(valueToValidate, value), value.msg)
          break
        }
        case 'isAlphanumeric': {
          checkThrow(undefinedString, isAlphanumeric(valueToValidate, value), value.msg)
          break
        }
        case 'isBoolean': {
          checkThrow(undefinedString, isBoolean(valueToValidate, value), value.msg)
          break
        }
        case 'isDataURI': {
          checkThrow(undefinedString, isDataURI(valueToValidate, value), value.msg)
          break
        }
        case 'isEmail': {
          checkThrow(undefinedString, isEmail(valueToValidate, value), value.msg)
          break
        }
        case 'isEmpty': {
          checkThrow(undefinedString, isEmpty(valueToValidate, value), value.msg)
          break
        }
        case 'isFloat': {
          checkThrow(undefinedString, isFloat(valueToValidate, value), value.msg)
          break
        }
        case 'isIn': {
          checkThrow(undefinedString, isIn(valueToValidate, value), value.msg)
          break
        }
        case 'isInt': {
          checkThrow(undefinedString, isInt(valueToValidate, value), value.msg)
          break
        }
        case 'isJSON': {
          checkThrow(undefinedString, isJSON(valueToValidate, value), value.msg)
          break
        }
        case 'isLength': {
          checkThrow(undefinedString, isLength(valueToValidate, value), value.msg)
          break
        }
        case 'isLowercase': {
          checkThrow(undefinedString, isLowercase(valueToValidate, value), value.msg)
          break
        }
        case 'isNumeric': {
          checkThrow(undefinedString, isNumeric(valueToValidate, value), value.msg)
          break
        }
        case 'isUppercase': {
          checkThrow(undefinedString, isUppercase(valueToValidate, value), value.msg)
          break
        }
        case 'isStrongPassword': {
          checkThrow(undefinedString, isStrongPassword(valueToValidate, value), value.msg)
          break
        }
        case 'isURL': {
          checkThrow(undefinedString, isURL(valueToValidate, value), value.msg)
          break
        }
        case 'isWhitelisted': {
          checkThrow(undefinedString, isWhitelisted(valueToValidate, value), value.msg)
          break
        }
        case 'isBlacklisted': {
          checkThrow(undefinedString, isBlacklisted(valueToValidate, value), value.msg)
          break
        }
        case 'isBlacklisted': {
          checkThrow(undefinedString, isBlacklisted(valueToValidate, value), value.msg)
          break
        }
        case 'isArray': {
          checkThrow(undefinedString, isArray(valueToValidate, value), value.msg)
          break
        }
        case 'isRegex': {
          checkThrow(undefinedString, isRegex(valueToValidate, value), value.msg)
          break
        }
        case 'isDate': {
          checkThrow(undefinedString, isDate(valueToValidate, value), value.msg)
          break
        }
        default: {
          break;
        }
      }
    }
  })
}

function checkThrow(messageWrong: string, result?: boolean, msg?: string) {
  if (result === undefined) {
    console.warn(messageWrong)
    throw new Error(messageWrong)
  }
  if (!result && msg !== undefined) {
    throw new Error(msg)
  }
}

function contains(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined)
    return validator.contains(temp, option.seed)
  return undefined
}

function equals(value: any, option: any): boolean | undefined {
  if (isArray(value, undefined))
    return _.isEqual(value, option.comparaison)
  else {
    if (isArray(option.comparaison, undefined)) {
      return option.comparaison.some((element: any) => {
        return _.isEqual(value, element)
      });
    } else {
      return _.isEqual(value, option.values)
    }
  }
}

function isAlpha(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isAlpha(value)
  }
  return undefined
}

function isAlphanumeric(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isAlpha(value)
  }
  return undefined
}

function isBoolean(value: any, option: any): boolean | undefined {
  if (typeof value === 'boolean')
    return true
  else if (typeof value === 'string') {
    return validator.isBoolean(value)
  } else if (typeof value === 'number') {
    return validator.isBoolean(value.toString())
  }
  return undefined
}

function isDataURI(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isDataURI(value)
  }
  return undefined
}

function isEmail(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isEmail(value)
  }
  return undefined
}

function isEmpty(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isEmpty(value, { ignore_whitespace: option.ignore_whitespace })
  else
    return _.isEmpty(value)
}

function isFloat(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined)
    return validator.isFloat(value, { gt: option.gt, lt: option.lt, min: option.gte, max: option.lte})
  return undefined
}

function isIn(value: any, option: any): boolean | undefined {
  if (typeof value === 'string' || typeof value === 'object') {
    if (isArray(option.values, undefined)) {
      return option.values.some((element: any) => {
        return _.includes(value, element)
      });
    } else {
      return _.includes(value, option.values)
    }
  }
  if (isArray(value, undefined))
    return _.includes(value, option.values)
  return undefined
}

function isInt(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined)
    return validator.isInt(value, { gt: option.gt, lt: option.lt, min: option.gte, max: option.lte})
  return undefined
}

function isJSON(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isJSON(value)
  return undefined
}

function isLength(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined)
    return validator.isLength(value, { min: option.min, max: option.max })
  return undefined
}

function isLowercase(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isLowercase(value)
  return undefined
}

function isNumeric(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined)
    return validator.isNumeric(value, { no_symbols: option.no_symbols })
  return undefined
}

function isUppercase(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isUppercase(value)
  return undefined
}

function isStrongPassword(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined) {
    if (validator.isStrongPassword(temp, { minLength: option.minLength, minLowercase: option.minLowercase, minUppercase: option.minUppercase, minNumbers: option.minNumbers, minSymbols: option.minSymbols })) {
      if (option.maxLength)
        return validator.isLength(temp, { min: 0, max: option.maxLength })
      return true
    }
    return false
  }
  return undefined
}

function isURL(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isURL(value, { protocols: option.protocols, require_protocol: option.require_protocol, require_valid_protocol: option.require_valid_protocol, require_host: option.require_host, allow_protocol_relative_urls: option.allow_protocol_relative_urls})
  return undefined
}

function isWhitelisted(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return validator.isWhitelisted(value, option.char)
  return undefined
}

function isBlacklisted(value: any, option: any): boolean | undefined {
  if (typeof value === 'string')
    return !validator.isWhitelisted(value, option.char)
  return undefined
}

function isArray(value: any, option: any): boolean | undefined {
  return _.isArray(value)
}

function isRegex(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    let reg = new RegExp(option.regex)
    return reg.test(value)
  }
  return undefined
}

function isDate(value: any, option: any): boolean | undefined {
  if (_.isDate(value)) {
    return true
  } else if (typeof value === 'string') {
    return !isNaN(Date.parse(value))
  } else if (typeof value === 'number') {
    return true
  }
  return undefined
}