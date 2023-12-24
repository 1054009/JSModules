const g_EventList = new Map() // Global list of events, because strict mode sucks

/*
*	Used to helper's hookEvent to store event information
*/
class Helper__EventCallbackData
{
	constructor(listener, eventName, permanent = false, callback)
	{
		const helper = Helper.assignToObject(this)

		if (!listener || !helper.isFunction(listener.addEventListener))
		throw new Error(`Invalid listener '${listener}' given to 'Helper__EventCallbackData'`)

		eventName = helper.getString(eventName)
		permanent = helper.getBoolean(permanent, true, false)

		if (!helper.isFunction(callback))
			throw new Error(`Invalid callback '${callback}' given to 'Helper__EventCallbackData'`)

		this.m_Listener = listener
		this.m_strEventName = eventName
		this.m_bPermanent = permanent
		this.m_fnCallback = callback
	}

	run(event)
	{
		this.getCallback()(event)
	}

	/*
	*	Getters
	*/
	getListener()
	{
		return this.m_Listener
	}

	getEventName()
	{
		return this.m_strEventName
	}

	getIsPermanent()
	{
		return this.m_bPermanent
	}

	getCallback()
	{
		return this.m_fnCallback
	}
}

/*
*
*	The main helper class
*
*/
export class Helper
{
	constructor()
	{

	}

	/**
 	*	Assigns a new helper object to another object
 	*	@param {Object} object The object to assing the helper to
	*	@returns {Helper} The created helper
 	*/
	static assignToObject(object)
	{
		if (!(object instanceof Object)) return null

		const helper = new Helper()
		object.m_Helper = helper

		object.getHelper = function()
		{
			return this.m_Helper
		}
		object.getHelper.bind(object)

		return helper
	}

	/**
 	*	Returns true if a value is a string, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isString(variable)
	{
		return (variable instanceof String) || typeof(variable) == "string"
	}

	/**
 	*	Returns true if a value is a number, false otherwise
 	*	@param {any} variable The value to test
	*	@param {boolean} [noBoundsCheck=false] Whether or not to compare max and min safe integer
	*	@param {boolean} [allowBigInt=true] Whether or not to allow BigInts to pass as numbers
	*	@returns {boolean}
 	*/
	isNumber(variable, noBoundsCheck = false, allowBigInt = true)
	{
		if (Number.isNaN(variable)) return false

		if (allowBigInt && ((variable instanceof BigInt) || typeof(variable) == "bigint"))
			return true

		if (!(variable instanceof Number) && typeof(variable) != "number") return false

		if (!noBoundsCheck)
		{
			if (variable > Number.MAX_SAFE_INTEGER) return false
			if (variable < Number.MIN_SAFE_INTEGER) return false
		}

		return true
	}

	/**
 	*	Returns true if a value is a boolean, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isBoolean(variable)
	{
		if (variable === true || variable === false) return true

		return (variable instanceof Boolean) || typeof(variable) == "boolean"
	}

	/**
 	*	Returns true if a value is an Array, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isArray(variable)
	{
		return variable instanceof Array
	}

	/**
 	*	Returns true if a value is a Map, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isMap(variable)
	{
		return variable instanceof Map
	}

	/**
 	*	Returns true if a value is a Function, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isFunction(variable)
	{
		return variable instanceof Function
	}

	/**
 	*	Returns true if a value is a Symbol, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isSymbol(variable)
	{
		return typeof(variable) == "symbol"
	}

	/**
 	*	Returns true if a value is a primitive data type, false otherwise
 	*	@param {any} variable The value to test
	*	@returns {boolean}
 	*/
	isPrimitive(variable)
	{
		if (variable === undefined || variable === null) return true
		return this.isString(variable) || this.isNumber(variable) || this.isBoolean(variable) || this.isSymbol(variable)
	}

	/**
 	*	Safely access a string data type
 	*	@param {any} variable The value to get as a string
	*	@param {string} [fallback=""] The value that will be returned if converson fails
	*	@returns {string}
 	*/
	getString(variable, fallback = "")
	{
		if (this.isString(variable))
			return variable

		fallback = this.getString(fallback)

		if (variable === undefined || variable === null)
			return fallback

		return String(variable)
	}

	/**
 	*	Safely access a number data type
 	*	@param {any} variable The value to get as a number
	*	@param {boolean} [isFloat=false] Whether or not the value should be treated as a float
	*	@param {number} [fallback=0] The value that will be returned if converson fails
	*	@param {boolean} [noBoundsCheck=false] Whether or not to compare max and min safe integer
	*	@returns {number}
 	*/
	getNumber(variable, isFloat = false, fallback = 0, noBoundsCheck = false)
	{
		if (this.isNumber(variable, noBoundsCheck))
			return variable

		isFloat = this.getBoolean(isFloat, false)
		noBoundsCheck = this.getBoolean(noBoundsCheck, false)
		fallback = this.getNumber(fallback, isFloat, 0, noBoundsCheck)

		const converted = isFloat ? parseFloat(variable) : parseInt(variable)
		if (!this.isNumber(converted, noBoundsCheck)) return fallback

		return converted
	}

	/**
 	*	Safely access an unsigned number data type
 	*	@param {any} variable The value to get as a number
	*	@param {boolean} [isFloat=false] Whether or not the value should be treated as a float
	*	@param {number} [fallback=0] The value that will be returned if converson fails
	*	@param {boolean} [noBoundsCheck=false] Whether or not to compare max and min safe integer
	*	@returns {number}
 	*/
	getUnsignedNumber(variable, isFloat = false, fallback = 0, noBoundsCheck = false)
	{
		if (this.isNumber(variable, noBoundsCheck))
			return this.clamp(variable, 0, Infinity)

		isFloat = this.getBoolean(isFloat, false)
		noBoundsCheck = this.getBoolean(noBoundsCheck, false)
		fallback = this.clamp(this.getNumber(fallback, isFloat, 0, noBoundsCheck), 0, Infinity)

		const converted = isFloat ? parseFloat(variable) : parseInt(variable)
		if (!this.isNumber(converted, noBoundsCheck)) return fallback

		return this.clamp(converted, 0, Infinity)
	}

	/**
 	*	Safely access a boolean data type
 	*	@param {any} variable The value to get as a boolean
	*	@param {boolean} [allowRegex=true] Whether or not to use regex on strings
	*	@param {boolean} [fallback=false] The value that will be returned if converson fails
	*	@returns {boolean}
 	*/
	getBoolean(variable, allowRegex = true, fallback = false)
	{
		if (this.isBoolean(variable))
			return variable

		allowRegex = this.getBoolean(allowRegex, true, true)
		fallback = this.getBoolean(fallback, true, false)

		if (allowRegex && this.isString(variable))
		{
			if ((/true/).test(variable)) return true
			if ((/false/).test(variable)) return false
		}

		return fallback
	}

	/**
 	*	Clamp a number between minimum and maximum values
 	*	@param {number} number The value to clamp
	*	@param {number} [min=Number.MIN_SAFE_INTEGER] The minimum allowed value
	*	@param {number} [max=Number.MAX_SAFE_INTEGER] The maximum allowed value
	*	@returns {number}
 	*/
	clamp(number, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER)
	{
		number = this.getNumber(number, true)
		min = this.getNumber(min, true, Number.MIN_SAFE_INTEGER)
		max = this.getNumber(max, true, Number.MAX_SAFE_INTEGER)

		if (number < min) return min
		if (number > max) return max
		return number
	}

	/**
 	*	Clamp a number between minimum and maximum values with rollover
 	*	@param {number} number The value to clamp
	*	@param {number} [min=Number.MIN_SAFE_INTEGER] The minimum allowed value
	*	@param {number} [max=Number.MAX_SAFE_INTEGER] The maximum allowed value
	*	@returns {number}
 	*/
	rollClamp(number, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER)
	{
		number = this.getNumber(number, true)
		min = this.getNumber(min, true, Number.MIN_SAFE_INTEGER)
		max = this.getNumber(max, true, Number.MAX_SAFE_INTEGER)

		if (number < min) return max
		if (number > max) return min
		return number
	}

	/**
 	*	INclusive random number generator
	*	@param {number} [min=Number.MIN_SAFE_INTEGER] The minimum allowed value
	*	@param {number} [max=Number.MAX_SAFE_INTEGER] The maximum allowed value
	*	@param {boolean} [allowFloat=false] Whether or not float values should be allowed
	*	@returns {number}
 	*/
	rng(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, allowFloat = false)
	{
		min = this.getNumber(min, true, Number.MIN_SAFE_INTEGER)
		max = this.getNumber(max, true, Number.MAX_SAFE_INTEGER)
		allowFloat = this.getBoolean(allowFloat, true, false)

		const number = (max - min + 1) * Math.random() + min
		return allowFloat ? number : number | 0
	}

	/**
 	*	Generates a random string with the given length
	*	@param {number} [length=12] The length of the random string. Unsigned.
	*	@returns {string}
 	*/
	randomString(length = 12)
	{
		length = this.getUnsignedNumber(length, false, 12)
		if (length < 1) return ""

		let built = ""

		while (built.length < length)
			built += this.rng(36, 1e0).toString(36)

		return built.substring(0, length)
	}

	/**
 	*	Filters an array in place
	*	@param {Array} target The array to be filtered
	*	@param {Function} callback The filter callback
 	*/
	filterArray(target, callback)
	{
		if (!this.isArray(target)) return
		if (!this.isFunction(callback))
			throw new Error(`Invalid callback ${callback} given to 'filterArray'`)

		target.splice(0, target.length, ...target.filter(callback))
	}

	/**
 	*	Deep copies an array
	*	@param {Array} target The array to be copied
	*	@returns {Array}
 	*/
	copyArray(target, lookup)
	{
		if (!this.isArray(target))
			return []

		const copy = []

		for (var value of target)
		{
			if (value instanceof Array)
			{
				if (!lookup) // Avoid infinite loop
				{
					lookup = new Map()
					lookup.set(target, copy)
				}

				if (lookup.get(value))
					value = lookup.get(value)
				else
					value = this.copyArray(value, lookup)
			}

			copy.push(value)
		}

		return copy
	}

	/**
 	*	Deep copies an Object
	*	@param {Object} target The Object to be copied
	*	@returns {Object}
 	*/
	copyObject(target, lookup)
	{
		const copy = {}

		for (const property of Object.getOwnPropertyNames(target))
		{
			var value = target[property]

			if (this.isArray(value))
				value = this.copyArray(value)
			else if (value instanceof Object)
			{
				if (!lookup) // Avoid infinite loop
				{
					lookup = new Map()
					lookup.set(target, copy)
				}

				if (lookup.get(value))
					value = lookup.get(value)
				else
					value = this.copyObject(value, lookup)
			}

			copy[property] = value
		}

		return copy
	}

	/**
 	*	Returns true if two Arrays contain the same data
	*	@param {Array} first The first Array to be compared
	*	@param {Array} second The second Array to be compared
	*	@returns {boolean}
 	*/
	compareArrays(first, second)
	{
		if (!this.isArray(first) || !this.isArray(second)) return false

		if (first === second) return true
		if (first.length != second.length) return false

		for (let i = 0; i < first.length; i++)
		{
			if (!this.smartCompare(first[i], second[i]))
				return false
		}

		return true
	}

	/**
 	*	Returns true if two Objects contain the same data
	*	@param {Object} first The first Object to be compared
	*	@param {Object} second The second Object to be compared
	*	@returns {boolean}
 	*/
	compareObjects(first, second)
	{
		if (!(first instanceof Object) || !(second instanceof Object)) return false

		if (first === second) return true

		const firstSet = Object.getOwnPropertyNames(first)
		firstSet.sort()

		const secondSet = Object.getOwnPropertyNames(second)
		secondSet.sort()

		if (!this.compareArrays(firstSet, secondSet)) return false

		for (const key of firstSet)
		{
			if (!this.smartCompare(first[key], second[key]))
				return false
		}

		return true
	}

	/**
 	*	Returns true if two data types contain the same information
	*	@param {Object} first The first Object to be compared
	*	@param {Object} second The second Object to be compared
	*	@returns {boolean}
 	*/
	smartCompare(first, second)
	{
		if (first === second) return true

		const firstIsArray = first instanceof Array
		const secondIsArray = second instanceof Array
		if (firstIsArray != secondIsArray) return false

		if (firstIsArray && secondIsArray)
			return this.compareArrays(first, second)

		const firstIsObject = first instanceof Object
		const secondIsObject = second instanceof Object
		if (firstIsObject != secondIsObject) return false

		if (firstIsObject && secondIsObject)
			return this.compareObjects(first, second)

		return false
	}

	/**
 	*	Returns the name of the current page
	*	@returns {string}
 	*/
	getPageName()
	{
		const base = location.href.substring(location.href.lastIndexOf('/') + 1).trim().toLowerCase()

		const index = base.lastIndexOf(".html")
		if (index == -1) return base

		return base.substring(0, index)
	}

	/**
 	*	Returns true if the window is on the provided page
	*	@param {string} pageName The name of the page to check for
	*	@returns {boolean}
 	*/
	isOnPage(pageName)
	{
		pageName = this.getString(pageName)
		if (pageName.length < 1) return false

		const page = this.getPageName()
		return pageName.toLowerCase() == page
	}

	/**
 	*	Returns a URLSearchParams object for the current page's search parameters
	*	@param {string} [url=null] If provided, this URL will be checked instead of the currenet window location
	*	@returns {URLSearchParams}
 	*/
	getSearchParameters(url = null)
	{
		url = this.getString(url, null)

		if (!url)
			url = window.location.search
		else
		{
			const index = url.indexOf('?')

			if (index == -1)
			{
				url = ""
				console.error("Invalid URL given for 'getSearchParameters'")
			}
			else
				url = url.substring(index)
		}

		return new URLSearchParams(url)
	}

	/**
	* 	Recursively indexes an object's properties into an array with sub-properties being separated by an arrow (->)
	*	@param {Map} map The map to index properties to
	*	@param {any} property The base property
	*	@param {any} value The property value
	*/
	indexProperties(map, property, value)
	{
		if (!this.isMap(map))
			throw new Error(`Invalid map ${map} given to indexProperties`)

		if (this.isPrimitive(value))
		{
			map.set(property, value)
			return
		}

		if (value instanceof Object)
		{
			const subProperties = Object.getOwnPropertyNames(value)

			for (const subProperty of subProperties)
				this.indexProperties(map, `${property}->${subProperty}`, value[subProperty])
		}
	}

	/*
	*	Runs an event
	*/
	runEvent(event)
	{
		if (!event) return

		const listener = event.currentTarget
		const list = g_EventList.get(listener)
		if (!list) return

		var needsReRun = false

		new Helper().filterArray(list, (callbackData) =>
		{
			const callback = callbackData.getCallback()

			if (callbackData.getIsPermanent())
			{
				callback(event)
				return true
			}

			if (callback(event) === false) // Callback isn't ready to be removed yet
			{
				needsReRun = true
				return true
			}

			return false
		})

		if (needsReRun)
			setTimeout(runEvent, 200, event)
	}

	/**
 	*	Adds an event to the listener
	*	@param {Object} listener The object 'addEventListener' will be called on
	*	@param {string} eventName The event name that will be passed to 'addEventListener'
	*	@param {boolean} [permanent=false] If false, the event will be removed after it runs
	*	@param {Function} callback The function that will be ran when the event is fired
 	*/
	hookEvent(listener, eventName, permanent = false, callback)
	{
		if (!listener || !this.isFunction(listener.addEventListener))
			throw new Error(`Invalid listener '${listener}' given to 'hookEvent'`)

		eventName = this.getString(eventName)
		permanent = this.getBoolean(permanent, true, false)

		if (!this.isFunction(callback))
			throw new Error(`Invalid callback '${callback}' given to 'hookEvent'`)

		const events = g_EventList

		var callbackList = events.get(listener)
		if (!callbackList)
		{
			callbackList = []
			events.set(listener, callbackList)

			listener.addEventListener(eventName, this.runEvent)
		}

		const callbackData = new Helper__EventCallbackData(listener, eventName, permanent, callback)
		callbackList.push(callbackData)
	}
}