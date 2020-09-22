var $ = require('./jquery.min.js')

$(function() {
  $('#files-folders').click(function(evt) {
		evt.stopPropagation();
		$(this).toggleClass('expanded');
	});
});