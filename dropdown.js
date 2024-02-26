import { Helper } from "./helper.js"
import { DOMBuilder } from "./dom_builder.js"

// Global list, because strict mode sucks
const g_Dropdowns = new Array()

/*
*
*	The manager for dropdowns
*
*/
export class DropdownManager
{
	constructor()
	{
		Helper.assignToObject(this)

		this.m_Builder = new DOMBuilder()

		this.m_DefaultDropdownProperties = {
			"style.position": "absolute",
			"style.zIndex": 2147483647
		}
	}

	/**
	* 	Fixes all dropdowns size and location
	*/
	static fixDropdowns(helper)
	{
		if (!helper)
			helper = new Helper()

		helper.filterArray(g_Dropdowns, (dropdown) =>
		{
			if (!dropdown)
				return false

			const attachedElement = dropdown.m_AttachedElement
			if (!attachedElement) // Variable isn't set, let the dropdown chill
				return true

			if (!helper.isValidElement(attachedElement))
			{
					// This dropdown's attached element went invalid at some point
					// Assume that we want it to close
					dropdown.remove()
					return false
			}

			const displayRect = helper.getElementRect(attachedElement)

			const body = document.body
			if (!body) // Should never happen
				return true

			const top = displayRect.y + displayRect.height

			const style = dropdown.style
			style.position = "absolute"
			style.left = `${displayRect.x}px`
			style.top = `${top}px`
			style.minWidth = `${displayRect.width}px`
			style.minHeight = `calc(${dropdown.children.length}em + 1px)`
			style.maxHeight = `${window.innerHeight - top}px`

			return true
		})
	}

	/**
	* 	Fixes all dropdowns size and location
	*/
	fixDropdowns()
	{
		DropdownManager.fixDropdowns(this.getHelper())
	}

	/**
	* 	Sets up listeners for fixDropdowns
	*/
	static setupDropdownEvents()
	{
		const helper = new Helper()

		const fixDropdownsCallback = () =>
		{
			// Do this so the event doesn't overwrite the helper check
			DropdownManager.fixDropdowns()
		}

		helper.hookEvent(window, "resize", true, fixDropdownsCallback)
		helper.hookEvent(document, "scroll", true, fixDropdownsCallback)
	}

	/**
	* 	Returns the DOMBuilder assigned to this manager
	*	@returns {DOMBuilder}
	*/
	getBuilder()
	{
		return this.m_Builder
	}

	/**
	* 	Sets all the default properties of a dropdown
	*	@param {Element} dropdown
	*/
	setDropdownProperties(dropdown)
	{
		if (!this.getHelper().isValidElement(dropdown))
			throw new Error(`Got invalid dropdown ${dropdown} in setDropdownProperties`)

		const builder = this.getBuilder()
		if (!builder)
			throw new Error("Failed to get DOMBuilder in setDropdownProperties")

		// Set the properties
		const wasPushed = builder.ensureTop(dropdown)
		{
			builder.setProperties(this.m_DefaultDropdownProperties)
		}
		if (wasPushed) builder.endPop()
	}

	/**
	* 	Creates a dropdown row with the provided text
	*	@param {string} text The text to display
	*	@returns {Element} The row
	*/
	createRow(text)
	{
		text = this.getHelper().getString(text)

		const builder = this.getBuilder()
		if (!builder)
			throw new Error("Failed to get DOMBuilder in createRow")

		const row = document.createElement("div")

		const wasPushed = builder.ensureTop(row)
		{
			builder.addClass("dropdown_row")

			builder.setProperty("innerHTML", text)
		}
		if (wasPushed) builder.endPop()

		return row
	}

	/**
	* 	Constructs and returns a dropdown with an array of strings to display for each option. Calls a setup callback after creation
	*	@param {Array} options The options to show, an array of strings
	*	@param {Function} callback The callback that will be ran when setup is finished. First argument is the dropdown
	*	@returns {Element} The created dropdown. null on failure
	*/
	createDropdown(options, callback)
	{
		const helper = this.getHelper()
		if (!helper.isArray(options))
			throw new Error(`Got non-array of options ${options} in createDropdown`)

		const builder = this.getBuilder()
		if (!builder)
			throw new Error("Failed to get DOMBuilder in createDropdown")

		let dropdown = null

		// Start building
		builder.start()
		{
			dropdown = builder.startElement("div")
			{
				// Set up basic information
				builder.addClass("dropdown_container")

				this.setDropdownProperties(builder.getTop())

				// Add all the bits
				for (const option of options)
				{
					const row = this.createRow(option)
					if (!helper.isValidElement(row))
					{
						console.error(`Failed to create row for ${option}`)
						continue
					}

					builder.push(row)
					builder.pop()
				}
			}
			builder.endElement()
		}
		builder.end()

		// Add it
		g_Dropdowns.push(dropdown)

		// Let the user set it up
		if (helper.isFunction(callback))
			callback(dropdown)

		return dropdown
	}

	/**
	* 	Attaches a dropdown to an object
	*	@param {Element} dropdown The dropdown to attach
	*	@param {Element} element The element the dropdown should be attached to. null to detach
	*/
	static attachToElement(dropdown, element)
	{
		const helper = new Helper()

		if (!helper.isValidElement(dropdown))
			throw new Error(`Got invalid dropdown ${dropdown} in attachToElement`)

		if (helper.isValidElement(element))
		{
			dropdown.m_AttachedElement = element
			element.m_Dropdown = dropdown
		}
		else
		{
			if (dropdown.m_AttachedElement)
				delete dropdown.m_AttachedElement.m_Dropdown

			delete dropdown.m_AttachedElement
		}

		// Update
		this.fixDropdowns()
	}

	/**
	* 	Attaches a dropdown to an object
	*	@param {Element} dropdown The dropdown to attach
	*	@param {Element} element The element the dropdown should be attached to. null to detach
	*/
	attachToElement(dropdown, element)
	{
		DropdownManager.attachToElement(dropdown, element)
	}

	/**
	* 	Closes a dropdown. This is the same as deleting it
	*	@param {Element} dropdown The dropdopwn to close
	*/
	closeDropdown(dropdown)
	{
		if (!this.getHelper().isValidElement(dropdown)) return

		dropdown.remove()
	}

	/**
	* 	Shows/hides a dropdown. Keeps the element valid
	*	@param {Element} dropdown The dropdopwn
	*	@param {boolean} show Whether or not the dropdown should be visible
	*/
	setDropdownVisibility(dropdown, show)
	{
		const helper = this.getHelper()

		if (!helper.isValidElement(dropdown)) return

		show = helper.getBoolean(show)

		const builder = this.getBuilder()
		if (!builder)
			throw new Error("Failed to get DOMBuilder in hideDropdown")

		const wasPushed = builder.ensureTop(dropdown)
		{
			if (show)
				builder.setProperty("style.display", "unset")
			else
				builder.setProperty("style.display", "none")
		}
		if (wasPushed) builder.endPop()
	}

	/**
	* 	Returns the current visibility of the dropdown
	*	@param {Element} dropdown The dropdopwn
	*	@returns {boolean}
	*/
	getDropdownVisibility(dropdown)
	{
		if (!this.getHelper().isValidElement(dropdown)) return

		return dropdown.style.display != "none"
	}

	/**
	* 	Toggles a dropdown's visibility
	*	@param {Element} dropdown The dropdown
	*	@returns {boolean} New visibility status
	*/
	toggleDropdownVisibility(dropdown)
	{
		this.setDropdownVisibility(dropdown, !this.getDropdownVisibility(dropdown))
	}
}
