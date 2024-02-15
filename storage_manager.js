import { Helper } from "./helper.js"
import { Enum } from "./enum.js"

export const STORAGE_TYPE = new Enum([ "SESSION", "LOCAL" ])

export class StorageManager
{
	constructor(type)
	{
		const helper = Helper.assignToObject(this)

		type = helper.clamp(helper.getUnsignedNumber(type, false, STORAGE_TYPE.SESSION), STORAGE_TYPE.MIN, STORAGE_TYPE.MAX)

		switch (type)
		{
			default:
			case STORAGE_TYPE.SESSION:
			{
				this.m_StorageController = sessionStorage
				break
			}

			case STORAGE_TYPE.LOCAL:
			{
				this.m_StorageController = localStorage
				break
			}
		}

		if (!this.m_StorageController)
			throw new Error(`Failed to get storage controller for type ${STORAGE_TYPE.translateValue(type)}`)
	}

	/*
	*	Getters
	*/

	/**
 	*	Returns the storage controller that this object is using
	*	@returns {(sessionStorage | localStorage)}
 	*/
	getStorageController()
	{
		return this.m_StorageController
	}

	/**
 	*	Returns the string value stored at the given key
 	*	@param {string} key The key to lookup in storage
	*	@param {string} [fallback=""] The fallback if the key isn't found
	*	@returns {string}
 	*/
	getStoredString(key, fallback = "")
	{
		return this.getHelper().getString(this.getStorageController().getItem(key), fallback)
	}

	/**
 	*	Returns the number value stored at the given key
 	*	@param {string} key The key to lookup in storage
	*	@param {number} [fallback=0] The fallback if the key isn't found
	*	@returns {number}
 	*/
	getStoredNumber(key, fallback = 0)
	{
		return this.getHelper().getNumber(this.getStoredString(key), true, fallback)
	}

	/**
 	*	Returns the boolean value stored at the given key
 	*	@param {string} key The key to lookup in storage
	*	@param {boolean} [fallback=false] The fallback if the key isn't found
	*	@returns {boolean}
 	*/
	getStoredBoolean(key, fallback = false)
	{
		return this.getHelper().getBoolean(this.getStoredString(key), true, fallback)
	}

	/*
	*	Setters
	*/

	/**
 	*	Stores the given value as a string at the given key
 	*	@param {string} key The key for the value to be stored at
	*	@param {any} value The value to be stored. Will be converted to a string if needed
 	*/
	setStoredValue(key, value)
	{
		key = this.getHelper().getString(key)
		if (key.length < 1)
			throw new Error(`Invalid key ${key} provided to 'setStoredValue'`)

		value = this.getHelper().getString(value)

		this.getStorageController().setItem(key, value)
	}

	/**
 	*	Removes the given key from storage if present
 	*	@param {string} key The key for the value to be stored at
 	*/
	removeStoredValue(key)
	{
		key = this.getHelper().getString(key)
		if (key.length < 1)
			throw new Error(`Invalid key ${key} provided to 'setStoredValue'`)

		this.getStorageController().removeItem(key)
	}

	/**
 	*	Clears the entire storage buffer
 	*/
	clear()
	{
		this.getStorageController().clear()
	}
}
