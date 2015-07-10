//apply masking to the demo-field
//pass the field reference and masking symbol
new MaskedPassword(document.getElementById("pwd"), '\u25CF');
	
//test the submitted value
document.getElementById('demo-form').onsubmit = function(e) {
	e.preventDefault();
	alert('pword = "' + document.getElementById('pwd-unmasked').value + '"');
	return false;
};
