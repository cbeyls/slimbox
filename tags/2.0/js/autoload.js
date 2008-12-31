// AUTOLOAD CODE BLOCK (MAY BE CHANGED OR REMOVED)
jQuery(function($) {
	$("a[rel^='lightbox']").slimbox({/* Put custom options here */}, null, function(el) {
		return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
	});
});