import { Helper } from "./helper.js"

export class DOMBuilder__Stack
{
	constructor()
	{
		Helper.assignToObject(this)
		this.m_Stack = []
	}

	/*
	*	Getters
	*/

	/**
 	*	Returns the amount of items on the stack
	*	@returns {number}
 	*/
	getCount()
	{
		return this.m_Stack.length
	}

	/**
 	*	Empties the stack
 	*/
	clear()
	{
		this.m_Stack.length = 0
	}

	/**
 	*	Returns the last element on the stack
	*	@returns {Element}
 	*/
	getLastElement()
	{
		return this.m_Stack[this.m_Stack.length - 1]
	}

	/*
	*	Setters
	*/

	/**
 	*	Pushes the gven element onto the stack
	*	@param {Element} element The element to push
 	*/
	push(element)
	{
		this.m_Stack.push(element)
	}

	/**
 	*	Pops x amount of items from the end of the stack
	*	@param {number} [amount=1] The amount to pop
 	*/
	pop(amount = 1)
	{
		amount = this.getHelper().clamp(this.getHelper().getNumber(amount, false, 1), 1, this.m_Stack.length)
		this.m_Stack.splice(-amount, amount)
	}
}

export class DOMBuilder
{
	constructor()
	{
		Helper.assignToObject(this)

		this.m_Stack = new DOMBuilder__Stack()
	}

	/**
 	*	Starts a stack
	*	@param {Element} parentElement The element the stack will start at
 	*/
	start(parentElement)
	{
		if (this.getIsActive())
			throw new Error("Attempted to start builder when already active")

		this.getStack().clear()

		if (!parentElement || !(parentElement instanceof Element))
			parentElement = this.getBody()

		this.getStack().push(parentElement)

		this.setIsActive(true)

		this.m_BaseElement = parentElement

		return parentElement
	}

	/**
 	*	Starts the stack
 	*/
	end()
	{
		if (!this.getIsActive())
			throw new Error("Attempted to end builder when inactive")

		if (this.getTop() == this.m_BaseElement)
			this.getStack().pop()

		const stackSize = this.getStack().getCount()
		if (stackSize > 0)
			throw new Error(`Ended builder with ${stackSize} item${stackSize == 1 ? "" : "s"} left on the stack`)

		this.setIsActive(false)
	}

	/**
 	*	Pushes an element onto the stack and sets the parent
	*	@param {Element} element The element to push
 	*/
	push(element)
	{
		const parent = this.getTop()
		parent.appendChild(element)

		this.getStack().push(element)
	}

	/**
	*	Pops the last element on the stack
	*/
	pop()
	{
		this.getStack().pop()
	}

	/**
	* 	Use this if you are unsure if you should use start or push
	*	@param {Element} element The base element
	*/
	startPush(element)
	{
		if (this.getIsActive())
			this.start(element)
		else
			this.push(element)
	}

	/**
	* 	Use this if you are unsure if you should use end or pop
	*/
	endPop()
	{
		const stack = this.getStack()

		if (stack.getCount() == 1)
			this.end()
		else
			this.pop()
	}

	/**
 	*	Starts a new element
	*	@param {string} type The type of element
 	*/
	startElement(type)
	{
		if (!this.getIsActive())
			throw new Error("Attempted to use builder when inactive")

		const newElement = document.createElement(type)
		if (!newElement)
			throw new Error(`Failed to create element of type ${type}`)

		this.push(newElement)

		return newElement
	}

	/**
 	*	Sets a single attribute on an element
	*	@param {string} attribute The attribute name
	*	@param {string} value The attribute value
 	*/
	setAttribute(attribute, value)
	{
		const helper = this.getHelper()
		const element = this.getTop()

		attribute = helper.getString(attribute)
		value = helper.getString(value)

		element.setAttribute(attribute, value)
	}

	/**
 	*	Sets attributes on an element
	*	@param {Object} attributes The attributes object
 	*/
	setAttributes(attributes)
	{
		if (!(attributes instanceof Object))
			throw new Error(`Invalid attributes ${attributes} given to 'setAttributes'`)

		const properties = Object.getOwnPropertyNames(attributes)
		for (const property of properties)
			this.setAttribute(property, attributes[property])
	}

	/**
 	*	Gets an attribute from an element
	*	@param {string} attribute The attribute name
	*	@returns {string}
 	*/
	getAttribute(attribute)
	{
		const element = this.getTop()
		return element.getAttribute(this.getHelper().getString(attribute))
	}

	/**
 	*	Adds a class to an element
	*	@param {string} className The name of the class
 	*/
	addClass(className)
	{
		const element = this.getTop()
		element.classList.add(this.getHelper().getString(className))
	}

	/**
 	*	Adds classes to an element
	*	@param {Array} classes The class array
 	*/
	addClasses(classes)
	{
		if (!this.getHelper().isArray(classes))
			throw new Error(`Invalid classes ${classes} given to 'addClasses'`)

		for (const className of classes)
			this.addClass(className)
	}

	/**
 	*	Sets the id on an element
	*	@param {string} id The id to set
 	*/
	setID(id)
	{
		const element = this.getTop()
		element.id = this.getHelper().getString(id)
	}

	/**
	*	Sets the given property to the given value
	*	@param {string} property The property to set. Can be separated with periods for multiple indexes, such as "style.width"
	*	@param {any} value The value to set the property to
	*/
	setProperty(property, value)
	{
		const helper = this.getHelper()
		const element = this.getTop()

		if (helper.isString(property) && property.includes('.'))
		{
			// Attempt to find the next to last value for period separated indexes
			// Uses optional chaining logic, if an invalid property is come across then nothing will happen
			const propertyKeys = property.split('.')
			let currentBit = element[propertyKeys[0]]

			if (!currentBit)
				return // Bad starting place

			for (let i = 1; i < (propertyKeys.length - 1); i++)
			{
				const nextProperty = propertyKeys[i]

				const nextBit = currentBit[nextProperty]
				if (!nextBit)
					return // Hit an invalid property, bail

				currentBit = nextBit
			}

			if (currentBit)
			{
				// If we have gotten to the end then we can set the final bit to whatever
				const finalProperty = propertyKeys[propertyKeys.length - 1]
				if (finalProperty)
					currentBit[finalProperty] = value
			}
		}
		else
			element[property] = value
	}

	/**
 	*	Sets properties on an element
	*	@param {Object} properties The properties object
 	*/
	setProperties(properties)
	{
		if (!(properties instanceof Object))
			throw new Error(`Invalid properties ${properties} given to 'setProperties'`)

		const propertyProperties = Object.getOwnPropertyNames(properties) // Awesome variable name
		for (const property of propertyProperties)
			this.setProperty(property, properties[property])
	}

	/**
 	*	Gets a property from an element
	*	@param {string} property The property to get
	*	@returns {string}
 	*/
	getProperty(property)
	{
		const element = this.getTop()
		return element[property]
	}

	/**
 	*	Ends the current element
 	*/
	endElement()
	{
		if (!this.getIsActive())
			throw new Error("Attempted to use builder when inactive")

		this.pop()
	}

	/*
	*	Getters
	*/

	/**
 	*	Returns if the builder is currently active in a commit
	*	@returns {boolean}
 	*/
	getIsActive()
	{
		return this.getHelper().getBoolean(this.m_bActive, false)
	}

	/**
 	*	Returns the stack
	*	@returns {DOMBuilder__Stack}
 	*/
	getStack()
	{
		return this.m_Stack
	}

	/**
 	*	Returns the document head
	*	@returns {Element} The document head
 	*/
	getHead()
	{
		return document.head
	}

	/**
 	*	Returns the document body
	*	@returns {Element} The document body
 	*/
	getBody()
	{
		return document.body
	}

	/**
	* 	Returns the element at the top of the stack
	*	@returns {Element}
	*/
	getTop()
	{
		return this.getStack().getLastElement()
	}

	/*
	*	Setters
	*/

	/**
 	*	Sets the builder's active state
	*	@param {boolean} [active=false] Whether or not to be active
 	*/
	setIsActive(active = false)
	{
		this.m_bActive = this.getHelper().getBoolean(active, false)
	}
}
