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
      const undefinedString: string = name + ' has a type which is not supported for validation ' + key
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
          checkThrow(undefinedString, isAlpha(valueToValidate), value.msg)
          break
        }
        case 'isAlphanumeric': {
          checkThrow(undefinedString, isAlphanumeric(valueToValidate), value.msg)
          break
        }
        case 'isBoolean': {
          checkThrow(undefinedString, isBoolean(valueToValidate), value.msg)
          break
        }
        case 'isDataURI': {
          checkThrow(undefinedString, isDataURI(valueToValidate), value.msg)
          break
        }
        case 'isEmail': {
          checkThrow(undefinedString, isEmail(valueToValidate), value.msg)
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
          checkThrow(undefinedString, isJSON(valueToValidate), value.msg)
          break
        }
        case 'isLength': {
          checkThrow(undefinedString, isLength(valueToValidate, value), value.msg)
          break
        }
        case 'isLowercase': {
          checkThrow(undefinedString, isLowercase(valueToValidate), value.msg)
          break
        }
        case 'isNumeric': {
          checkThrow(undefinedString, isNumeric(valueToValidate, value), value.msg)
          break
        }
        case 'isUppercase': {
          checkThrow(undefinedString, isUppercase(valueToValidate), value.msg)
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
        case 'isArray': {
          checkThrow(undefinedString, isArray(valueToValidate), value.msg)
          break
        }
        case 'isRegex': {
          checkThrow(undefinedString, isRegex(valueToValidate, value), value.msg)
          break
        }
        case 'isDate': {
          checkThrow(undefinedString, isDate(valueToValidate), value.msg)
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
    throw new TypeError(messageWrong)
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
  if (isArray(value))
    return _.isEqual(value, option.comparaison)
  else {
    if (isArray(option.comparaison)) {
      return option.comparaison.some((element: any) => {
        return _.isEqual(value, element)
      });
    } else {
      return _.isEqual(value, option.values)
    }
  }
}

function isAlpha(value: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isAlpha(value)
  }
  return undefined
}

function isAlphanumeric(value: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isAlpha(value)
  }
  return undefined
}

function isBoolean(value: any): boolean | undefined {
  if (typeof value === 'boolean')
    return true
  else if (typeof value === 'string') {
    return validator.isBoolean(value)
  } else if (typeof value === 'number') {
    return validator.isBoolean(value.toString())
  }
  return undefined
}

function isDataURI(value: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isDataURI(value)
  }
  return undefined
}

function isEmail(value: any): boolean | undefined {
  if (typeof value === 'string') {
    return validator.isEmail(value)
  }
  return undefined
}

function isEmpty(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    let options: any = { ignore_whitespace: option.ignore_whitespace }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isEmpty(value, options)
  } else
    return _.isEmpty(value)
}

function isFloat(value: any, option: any): boolean | undefined {
  let temp: string | undefined = undefined

  if (typeof value === 'number') {
    temp = value.toString()
  } else if (typeof value === 'string') {
    temp = value
  }
  if (temp !== undefined) {
    let options: any = { gt: option.gt, lt: option.lt, min: option.gte, max: option.lte }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isFloat(temp, options)
  }
  return undefined
}

function isIn(value: any, option: any): boolean | undefined {
  if (typeof value === 'string' || typeof value === 'object') {
    if (isArray(option.values)) {
      return option.values.some((element: any) => {
        return _.includes(value, element)
      });
    } else {
      return _.includes(value, option.values)
    }
  }
  if (isArray(value))
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
  if (temp !== undefined) {
    let options: any = { gt: option.gt, lt: option.lt, min: option.gte, max: option.lte }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isInt(temp, options)
  }
  return undefined
}

function isJSON(value: any): boolean | undefined {
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
  if (temp !== undefined) {
    let options: any = { min: option.min, max: option.max }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isLength(temp, options)
  }
  return undefined
}

function isLowercase(value: any): boolean | undefined {
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
  if (temp !== undefined) {
    let options: any = { no_symbols: option.no_symbols }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isNumeric(temp, options)
  }
  return undefined
}

function isUppercase(value: any): boolean | undefined {
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
  if (typeof value === 'string') {
    let options: any = { protocols: option.protocols, require_protocol: option.require_protocol, require_valid_protocol: option.require_valid_protocol, require_host: option.require_host, allow_protocol_relative_urls: option.allow_protocol_relative_urls }
    options = _.filter(options, (value) => value !== undefined)
    if (_.isEmpty(options))
      options = undefined
    return validator.isURL(value, options)
  }
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

function isArray(value: any): boolean | undefined {
  return _.isArray(value)
}

function isRegex(value: any, option: any): boolean | undefined {
  if (typeof value === 'string') {
    const reg = new RegExp(option.regex)
    return reg.test(value)
  }
  return undefined
}

function isDate(value: any): boolean | undefined {
  if (_.isDate(value)) {
    return true
  } else if (typeof value === 'string') {
    return !isNaN(Date.parse(value))
  } else if (typeof value === 'number') {
    return true
  }
  return undefined
}