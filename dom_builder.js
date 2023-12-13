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
		const helper = Helper.assignToObject(this)

		this.m_Stack = new DOMBuilder__Stack()
	}

	/**
 	*	Starts a stack
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
	}

	/**
 	*	Starts the stack
 	*/
	end()
	{
		if (!this.getIsActive())
			throw new Error("Attempted to end builder when inactive")

		if (this.getStack().getLastElement() == this.m_BaseElement)
			this.getStack().pop()

		const stackSize = this.getStack().getCount()
		if (stackSize > 0)
			throw new Error(`Ended builder with ${stackSize} item${stackSize == 1 ? "" : "s"} left on the stack`)

		this.setIsActive(false)
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

		const parent = this.getStack().getLastElement()
		parent.appendChild(newElement)

		this.getStack().push(newElement)
	}

	/**
 	*	Sets a single attribute on an element
	*	@param {string} attribute The attribute name
	*	@param {string} value The attribute value
 	*/
	setAttribute(attribute, value)
	{
		const helper = this.getHelper()

		const element = this.getStack().getLastElement()

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

		const helper = this.getHelper()

		const element = this.getStack().getLastElement()

		const properties = Object.getOwnPropertyNames(attributes)
		for (const property of properties)
			this.setAttribute(helper.getString(property), helper.getString(attributes[property]))
	}

	/**
 	*	Ends the current element
 	*/
	endElement()
	{
		if (!this.getIsActive())
			throw new Error("Attempted to use builder when inactive")

		this.getStack().pop()
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