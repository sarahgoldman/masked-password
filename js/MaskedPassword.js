/*******************************************************************************
 Adapted from                                                 MaskedPassword.js
                     sitepoint.com/better-passwords-1-the-masked-password-field
*******************************************************************************/

//masked password constructor
function MaskedPassword(passfield, symbol) {
  
	//if the browser is unsupported, silently fail
	//[pre-DOM1 browsers generally, and Opera 8 specifically]
	if(typeof document.getElementById == 'undefined'
		|| typeof document.styleSheets == 'undefined') { return false; }

	//or if the passfield doesn't exist, silently fail
	if(passfield == null) { return false; }
	
	//save the masking symbol 
	this.symbol = symbol;
	
	//delete any default value for security (and simplicity!)
	passfield.value = '';
	passfield.defaultValue = '';

	//create a context wrapper, so that we have sole context for modifying the content
	//(ie. we can go context.innerHTML = replacement; without catering for 
	// anything else that's there besides the password field itself)
	//and give it a distinctive and underscored name, to prevent conflict
	
	passfield._contextwrapper = this.createContextWrapper(passfield);
	
	//save a reference to the wrapper because the passfield reference will be lost soon
	var wrapper = passfield._contextwrapper;
	
	//create the HTML for the hidden field
	//using the name from the original password field
	var hiddenfield = '<input type="hidden" name="' + passfield.name + '" id="' + passfield.id + '-unmasked">';
	
	//copy the HTML from the password field to create the new plain-text field
	var textfield = this.convertPasswordFieldHTML(passfield);

	//write the hiddenfield and textfield HTML into the wrapper, replacing what's there
	wrapper.innerHTML = hiddenfield + textfield;
	
	//grab back the passfield reference back and save it back to passfield
	//then add the masked-password class
	passfield = wrapper.lastChild;
	passfield.className += ' masked';
	
	//try to disable autocomplete for this field
	passfield.setAttribute('autocomplete', 'off');

	//now grab the hidden field reference, 
	//saving it as a property of the passfield
	passfield._realfield = wrapper.firstChild;
	
	//restore its contextwrapper reference
	passfield._contextwrapper = wrapper;

	//limit the caret position so that you can only edit or select from the end
	this.limitCaretPosition(passfield);
	
	//save a reference to this
	var self = this;
	
	//then apply the core events to the visible field
	passfield.addEventListener('change', function(e) { 
		self.doPasswordMasking(e.target); 
	});
	passfield.addEventListener('input', function(e) { 
		self.doPasswordMasking(e.target); 
	});
	passfield.addEventListener('keyup', function(e) { 
		self.doPasswordMasking(e.target);
	});
	
	//so between those events we get completely rock-solid behavior
	//with enough redundency to ensure that all input paths are covered
	//and no flickering of text between states :-)

	//force the parent form to reset onload
	//thereby clearing all values after soft refreh
	this.forceFormReset(passfield);

	//return true for success
	return true;
}

//associated utility methods
MaskedPassword.prototype = {

	//implement password masking for a textbox event
	doPasswordMasking : function(textbox) {
		//create the plain password string
		var plainpassword = '';
		
		//run through the characters in the input string
		//and build the plain password out of the corresponding characters
		//from the real field, and any plain characters in the input
		for(var i=0; i<textbox.value.length; i++) {
			if(textbox.value.charAt(i) == this.symbol) {
				plainpassword += textbox._realfield.value.charAt(i);
			} else {
				plainpassword += textbox.value.charAt(i);
			}
		}
		
		//get the masked version of the plainpassword
		var maskedstring = this.encodeMaskedPassword(plainpassword);
		
		//copy the plain password to the real field
		textbox._realfield.value = plainpassword;
		
		//then write the masked value to the original textbox
		textbox.value = maskedstring;
	},
	
	//convert a plain-text password to a masked password
	encodeMaskedPassword : function(passwordstring) {
    	//create the masked password string then iterate  
		//through he characters in the plain password
		for(var maskedstring = '', i=0; i<passwordstring.length; i++) {
      		maskedstring += this.symbol;
		}
		
		//return the final masked string
		return maskedstring;
	},
	
	//create a context wrapper element around a password field
	createContextWrapper : function(passfield) {
		//create the wrapper and add its class
		//it has to be an inline element because we don't know its context
		var wrapper = document.createElement('span');
		
		//enforce relative positioning
		wrapper.style.position = 'relative';
		
		//insert the wrapper directly before the passfield
		passfield.parentNode.insertBefore(wrapper, passfield);
		
		//then move the passfield inside it
		wrapper.appendChild(passfield);
		//return the wrapper reference
		return wrapper;
	},
	
	//force a form to reset its values, so that soft-refresh does not retain them
	forceFormReset : function(textbox) {
		//find the parent form from this textbox reference
		//(which may not be a textbox, but that's fine, it just a reference name!)
		while(textbox) {
			if(/form/i.test(textbox.nodeName)) { break; }
			textbox = textbox.parentNode;
		}
		//if the reference is not a form then the textbox wasn't wrapped in one
		//so in that case we'll just have to abandon what we're doing here
		if(!/form/i.test(textbox.nodeName)) { return null; }
		
		//otherwise bind a load event to call the form's reset method
		document.addEventListener('DOMContentLoaded', function() { textbox.reset(); }, false);
		
		//return the now-form reference
		return textbox;
	},
	
	//copy the HTML from a password field to a plain text field
	convertPasswordFieldHTML : function(passfield, addedattrs) {
		//start the HTML for a text field
		var textfield = '<input';
		
		//now run through the password fields' specified attributes 
		//and copy across each one into the textfield HTML
		//*except* for its name and type
		for(var fieldattributes = passfield.attributes, j=0; j<fieldattributes.length; j++) {
			if(!/^(type|name)/.test(fieldattributes[j].name)) {
				textfield += ' ' + fieldattributes[j].name + '="' + fieldattributes[j].value + '"';
			}
		}
		
		//now add the type of "text" to the end, plus the autocomplete attributes, and close it
		textfield += ' type="text" autocomplete="off" autocomplete="off" autocorrect="off">';
		
		//return the finished textfield HTML
		return textfield;
	},
	
	//force the caret in a textbox to stay at the end
	limitCaretPosition : function(textbox) {
		//create a null timer reference and start function
		var timer = null, start = function() {
			//prevent multiple instances
			if(timer == null)  {
				//create an interval that continually force the position
				//as long as the field has the focus
				timer = window.setInterval(function()  { 
					//allow selection from or position at the end
					//otherwise force position to the end
					var valuelength = textbox.value.length;
					if(!(textbox.selectionEnd == valuelength && textbox.selectionStart <= valuelength)) {
						textbox.selectionStart = valuelength;
						textbox.selectionEnd = valuelength;
					}
					
				}, 100);
			}
		},
		
		//and a stop function
		stop = function() {
			window.clearInterval(timer);
			timer = null;
		};
		
		//add events to start and stop the timer
		textbox.addEventListener('focus', function() { start(); });
		textbox.addEventListener('blur', function() { stop(); });
	}

}