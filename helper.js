// Global lists, because strict mode sucks
const g_TimerTimeouts = new Map()
const g_TimerCallbacks = new Map()
const g_EventList = new Map()

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
	* 	Returns true if a value is a DOM Element, false otherwise
	*	@param {any} variable The value to test
	*	@returns {boolean}
	*/
	isElement(variable)
	{
		return variable instanceof Element
	}

	/**
	* 	Returns true if a value is a valid DOM Element, false otherwise
	*	@param {any} variable The value to test
	*	@returns {boolean}
	*/
	isValidElement(variable)
	{
		if (!this.isElement(variable)) return false

		return Boolean(variable.parentNode) && Boolean(variable.offsetParent)
	}

	/**
	*	Returns true if a string is an IPv4 address, false otherwise
	* 	@param {String} ip The IPv4 address to validate
	* 	@returns {boolean}
	*/
	isIPv4(ip)
	{
		if (!this.isString(ip)) return false
		return (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g).test(ip)
	}

	/**
	*	Returns true if a string is an IPv6 address, false otherwise
	* 	@param {String} ip The IPv6 address to validate
	* 	@returns {boolean}
	*/
	isIPv6(ip)
	{
		if (!this.isString(ip)) return false
		return (/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/).test(ip)
	}

	/**
	*	Returns true if a string is an IPv4 or IPv6 address, false otherwise
	* 	@param {String} ip The IP address to validate
	* 	@returns {boolean}
	*/
	isIP(ip)
	{
		return this.isIPv4(ip) || this.isIPv6(ip)
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

	/**
	* 	Returns the current UTC time in seconds
	*	@param {boolean} [noFloor=false] Whether or not to floor the time
	*	@returns {number}
	*/
	getTime(noFloor = false)
	{
		const seconds = Date.now() / 1000
		if (noFloor) return seconds

		return Math.floor(seconds)
	}

	/**
	* 	Returns true if the provided string is a valid URL, false otherwise
	*	@param {string} url The URL to check
	*	@returns {boolean}
	*/
	isValidURL(url)
	{
		if (!this.isString(url))
			return false

		try
		{
			return Boolean(new URL(url))
		}
		catch (_)
		{
			return false
		}
	}

	/**
	* 	Fetches a URL as JSON and runs a callback
	*	@param {string} url The URL to fetch
	*	@param {Function} callback The callback to be ran
	*/
	fetchJSON(url, callback)
	{
		if (!this.isValidURL(url)) return
		if (!this.isFunction(callback)) return

		fetch(url,
		{
			method: "GET"
		}).then((response) =>
		{
			if (!response.ok)
				return null

			return response.json()
		}).then((response) =>
		{
			callback(response)
		}).catch(() =>
		{
			callback(null)
		})
	}

	/**
	* 	Converts a string to title case
	*	@param {string} target The string to convert
	*	@param {boolean} [noReplace=false] Set to false to stop underscores being interpreted as spaces
	*	@returns {string}
	*/
	toTitleCase(target, noReplace = false)
	{
		if (!this.isString(target)) return ""

		if (!noReplace)
			target = target.replace('_', ' ')

		const constructor = []
		for (const section of target.split(' '))
		{
			const first = section.substring(0, 1).toUpperCase()
			const rest = section.substring(1).toLowerCase()

			constructor.push(first + rest)
		}

		return constructor.join(' ')
	}

	/**
	* 	Gets the timer timeout ID from the given name, null if not found
	*	@param {string} name The name of the timer
	*/
	getTimerID(name)
	{
		const timeoutID = g_TimerTimeouts.get(name)
		if (!this.isNumber(timeoutID)) return null

		return timeoutID
	}

	/**
	* 	Gets the timer callback function from the given name, null if not found
	*	@param {string} name The name of the timer
	*/
	getTimerCallback(name)
	{
		const timeoutID = this.getTimerID(name)
		if (!this.isNumber(timeoutID)) return null

		const callback = g_TimerCallbacks.get(timeoutID)
		if (!this.isFunction(callback)) return null
		if (!this.isFunction(callback.m_fnCallback)) return null

		return callback.m_fnCallback
	}

	/**
	* 	Creates a timer with the given name and delay
	*	@param {string} name The name of the timer
	*	@param {number} delay How much time, in seconds, there will be between each iteration
	*	@param {Function} callback The function to run on an iteration
	*/
	createTimer(name, delay, callback)
	{
		if (!this.isString(name))
			throw new Error(`Bad name ${name} given to createTimer`)

		if (!this.isNumber(delay))
			throw new Error(`Bad delay ${delay} given to createTimer`)

		if (!this.isFunction(callback))
			throw new Error(`Bad callback ${callback} given to createTimer`)

		// Turn the delay into milliseconds for setTimeout
		delay *= 1000

		// Remove the old one
		this.destroyTimer(name)

		// Scope it
		{
			const storedName = name
			const storedDelay = delay
			const storedCallback = callback

			let adjustedCallback = null
			adjustedCallback = () =>
			{
				storedCallback()
				if (!this.getTimerID(storedName)) return // Removed, don't run again

				const newID = setTimeout(adjustedCallback, storedDelay) // Infinite loop every x seconds
				g_TimerTimeouts.set(storedName, newID)
			}

			adjustedCallback.m_fnCallback = storedCallback

			// Index it
			const id = setTimeout(adjustedCallback, delay)

			g_TimerTimeouts.set(name, id)
			g_TimerCallbacks.set(id, adjustedCallback)
		}
	}

	/**
	* 	Destroys the timer with the given name
	*	@param {string} name The name of the timer
	*/
	destroyTimer(name)
	{
		const existingID = this.getTimerID(name)
		if (!existingID) return

		g_TimerTimeouts.delete(name)
		g_TimerCallbacks.delete(existingID)

		clearTimeout(existingID)
	}

	/**
	* 	Creates a simple timer that runs once
	*	@param {number} delay How many seconds to wait before running the callback
	*	@param {Function} callback The callback to run
	*/
	createSimpleTimer(delay, callback)
	{
		if (!this.isNumber(delay))
			throw new Error(`Bad delay ${delay} given to createSimpleTimer`)

		if (!this.isFunction(callback))
			throw new Error(`Bad callback ${callback} given to createSimpleTimer`)

		delay *= 1000

		setTimeout(callback, delay)
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
