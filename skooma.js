/*
A functional HTML generation library.

Example:
	html.label(
		html.span("Delete everything", {class: ["warning", "important"]}),
		html.button("Click", {onClick: e => document.body.innerHTML=""}),
	)
or
	html.ul([1, 2, 3, 4, 5].map(x => html.li(x)), {class: "numbers"})
*/

const keyToPropName = key => key.replace(/^[A-Z]/, a => "-"+a).replace(/[A-Z]/g, a => '-'+a.toLowerCase())

const insertStyles = (rule, styles) => {
	for (let [key, value] of Object.entries(styles))
		if (typeof value == "undefined")
			rule.removeProperty(keyToPropName(key))
	else
		rule.setProperty(keyToPropName(key), value.toString())
}

const parseAttribute = (attribute) => {
	if (typeof attribute == "string" || typeof attribute == "number")
		return attribute
	else if ("join" in attribute)
		return attribute.join(" ")
	else
		return JSON.stringify(attribute)
}

const parseArgs = (element, ...args) => {
	if (element.content) element = element.content
	for (let arg of args)
		if (typeof arg == "string" || typeof arg == "number")
			element.appendChild(document.createTextNode(arg))
		else if ("nodeName" in arg)
			element.appendChild(arg)
		else if ("length" in arg)
			parseArgs(element, ...arg)
		else
			for (let key in arg)
				if (key == "style" && typeof(arg[key]=="object"))
					insertStyles(element.style, arg[key])
				else if (key == "shadowRoot")
					parseArgs((element.shadowRoot || element.attachShadow({mode: "open"})), arg[key])
				else if (typeof arg[key] == "function")
					element.addEventListener(key.replace(/^on[A-Z]/, x => x.charAt(x.length-1).toLowerCase()), e => e.preventDefault() || arg[key](e))
				else if (arg[key] === true)
					{if (!element.hasAttribute(key)) element.setAttribute(key, '')}
				else if (arg[key] === false)
					element.removeAttribute(key)
				else
					element.setAttribute(key, parseAttribute(arg[key]))
}

const node = (name, args, options) => {
	let element
	if (options.nameFilter) name = options.nameFilter(name)
	if (options.xmlns)
		element = document.createElementNS(options.xmlns, name)
	else
		element = document.createElement(name)
	parseArgs(element, args)
	return element
}

const nameSpacedProxy = (options={}) => new Proxy(Window, {
	get: (target, prop, receiver) => { return (...args) => node(prop, args, options) },
	has: (target, prop) => true,
})

export const html = nameSpacedProxy({nameFilter: name => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()})
export const svg = nameSpacedProxy({xmlns: "http://www.w3.org/2000/svg"})
