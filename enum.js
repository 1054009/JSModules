import { Helper } from "./helper.js"

export class Enum
{
	constructor(array)
	{
		const helper = Helper.assignToObject(this)

		if (!helper.isArray(array) || array.length < 1)
			throw new Error(`Invalid array ${array} given to Enum`)

		this.m_TranslateTable = new Map()

		for (let i = 0; i < array.length; i++)
		{
			let key = helper.getString(array[i])
			if (key.length < 1)
				throw new Error(`Invalid key ${key} found in Enum`)

			key = key.toUpperCase()

			this[key] = i + 1

			this.m_TranslateTable.set(this[key], key)
		}

		this.MIN = 1
		this.MAX = array.length

		Object.freeze(this.m_TranslateTable)
		Object.freeze(this)
	}

	/**
 	*	Returns the string equivalent of an enum's value
 	*	@param {number} value The value to translate
	*	@returns {string}
 	*/
	translateValue(value)
	{
		value = this.getHelper().getUnsignedNumber(value, false, 0)
		if (value < this.MIN)
			return "INVALID_ENUM_VALUE"

		const translated = this.m_TranslateTable.get(value)
		return translated || "INVALID_ENUM_VALUE"
	}

	/**
 	*	Attempts to lookup the numerical value of a string returned by translateValue. -1 if not found
 	*	@param {string} value The value to lookup
	*	@returns {number}
 	*/
 	lookupValue(value)
 	{
 		value = this.getHelper().getString(value)
 		if (value.length < 1) return -1

 		for (const [ key, stored ] of this.m_TranslateTable.entries())
 		{
 			if (stored == value)
 				return key
 		}

 		return -1
 	}
}