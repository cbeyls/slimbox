/*
	Slimbox v1.5-dev - The ultimate lightweight Lightbox clone
	by Christophe Beyls (http://www.digitalia.be) - MIT-style license.
	Inspired by the original Lightbox v2 by Lokesh Dhakar.
*/

var Slimbox;

(function() {

	// Global variables, accessible to Slimbox only
	var state = 0, options, images, activeImage, top, eventKeydown, fx, preload, preloadPrev = new Image(), preloadNext = new Image();
	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)

	// DOM elements
	var overlay, center, image, prevLink, nextLink, bottomContainer, bottom;

	/*
		Initialization
	*/

	window.addEvent("domready", function() {
		eventKeyDown = keyDown.create({event: true});

		$(document.body).adopt(
			overlay = new Element("div", {id: "lbOverlay"}),
			center = new Element("div", {id: "lbCenter", styles: {display: "none"}}),
			bottomContainer = new Element("div", {id: "lbBottomContainer", styles: {display: "none"}})
		);

		image = new Element("div", {id: "lbImage"}).injectInside(center).adopt(
			prevLink = new Element("div", {id: "lbPrevLink", styles: {display: "none"}}).addEvent("click", previous),
			nextLink = new Element("div", {id: "lbNextLink", styles: {display: "none"}}).addEvent("click", next)
		);

		bottom = new Element("div", {id: "lbBottom"}).injectInside(bottomContainer).adopt(
			new Element("div", {id: "lbCloseLink"}).addEvent("click", overlay.onclick = close),
			new Element("div", {id: "lbCaption"}),
			new Element("div", {id: "lbNumber"}),
			new Element("div", {styles: {clear: "both"}})
		);

		fx = {
			overlay: overlay.effect("opacity", {duration: 500}).hide(),
			image: image.effect("opacity", {duration: 500, onComplete: nextEffect}),
			bottom: bottom.effect("margin-top", {duration: 400})
		};
	});


	/*
		API
	*/

	Slimbox = {
		open: function(_images, startImage, _options) {
			options = $extend({
				overlayOpacity: 0.8,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
				resizeDuration: 400,			// Duration of each of the box resize animations (in milliseconds)
				resizeTransition: false,		// Default transition in mootools
				initialWidth: 250,			// Initial width of the box (in pixels)
				initialHeight: 250,			// Initial height of the box (in pixels)
				animateCaption: true,
				showCounter: true,			// If true, a counter will only be shown if there is more than 1 image to display
				counterText: "Image {x} of {y}"		// Translate or change as you wish
			}, _options || {});

			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == "string") {
				_images = [[_images,startImage]];
				startImage = 0;
			}

			images = _images;
			position();
			setup(true);
			top = window.getScrollTop() + (window.getHeight() / 15);
			fx.resize = center.effects($extend({duration: options.resizeDuration, onComplete: nextEffect}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			center.setStyles({top: top, width: options.initialWidth, height: options.initialHeight, marginLeft: -(options.initialWidth/2), display: ""});
			fx.overlay.start(options.overlayOpacity);
			changeImage(startImage);
			return false;
		}
	};

	Element.extend({
		slimbox: function(_options) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).slimbox(_options);
		}
	});

	Elements.extend({
		slimbox: function(_options, filter) {
			var links = this;

			links.forEach(function(link) {
				link.onclick = function() {
					// Build the list of images that will be displayed
					// startIndex is the image index related to the link that was clicked
					var startIndex, _images = [], i = 0;
					((filter && (this.rel.length == 8)) ? [this] : links).forEach(function(el) {
						if (!filter || (el.rel == this.rel)) {
							_images.push([el.href, el.title]);
							if (el.href == this.href) startIndex = i;
							i++;
						}
					}, this);
					return Slimbox.open(_images, startIndex, _options);
				};
			});
		}
	});


	/*
		Internal functions
	*/

	function position() {
		overlay.setStyles({top: window.getScrollTop(), height: window.getHeight()});
	}

	function setup(open) {
		$$("object", window.ie ? "select" : "embed").forEach(function(el) {
			if (open) el.slimbox = el.style.visibility;
			el.style.visibility = open ? "hidden" : el.slimbox;
		});
		var fn = open ? "addEvent" : "removeEvent";
		window[fn]("scroll", position)[fn]("resize", position);
		document[fn]("keydown", eventKeyDown);
	}

	function keyDown(event) {
		switch(event.keyCode) {
			case 27:	// Esc
			case 88:	// 'x'
			case 67:	// 'c'
				close();
				break;
			case 37:	// Left arrow
			case 80:	// 'p'
				previous();
				break;	
			case 39:	// Right arrow
			case 78:	// 'n'
				next();
		}
	}

	function previous() {
		changeImage(activeImage - 1);
	}

	function next() {
		changeImage(activeImage + 1);
	}

	function changeImage(imageNum) {
		if ((state > 1) || (imageNum < 0) || (imageNum >= images.length)) return false;
		state = 2;
		activeImage = imageNum;

		$$(prevLink, nextLink, bottomContainer).setStyle("display", "none");
		fx.bottom.stop().set(0);
		fx.image.hide();
		center.className = "lbLoading";

		preload = new Image();
		preload.onload = nextEffect;
		preload.src = images[imageNum][0];
	}

	function nextEffect() {
		switch (state++) {
			case 2:
				center.className = "";
				image.style.backgroundImage = "url(" + images[activeImage][0] + ")";
				$$(image, bottom).setStyle("width", preload.width);
				$$(image, prevLink, nextLink).setStyle("height", preload.height);

				$("lbCaption").setHTML(images[activeImage][1] || "");
				$("lbNumber").setHTML((options.showCounter && (images.length > 1)) ? options.counterText.replace(/{x}/, activeImage + 1).replace(/{y}/, images.length) : "");

				if (activeImage) preloadPrev.src = images[activeImage - 1][0];
				if (activeImage != (images.length - 1)) preloadNext.src = images[activeImage + 1][0];

				if (center.clientHeight != image.offsetHeight) {
					fx.resize.start({height: image.offsetHeight});
					break;
				}
				state++;
			case 3:
				if (center.clientWidth != image.offsetWidth) {
					fx.resize.start({width: image.offsetWidth, marginLeft: -image.offsetWidth/2});
					break;
				}
				state++;
			case 4:
				bottomContainer.setStyles({top: top + center.clientHeight, height: 0, marginLeft: center.style.marginLeft, display: ""});
				fx.image.start(1);
				break;
			case 5:
				if (activeImage) prevLink.style.display = "";
				if (activeImage != (images.length - 1)) nextLink.style.display = "";
				if (options.animateCaption) {
					fx.bottom.set(-bottom.offsetHeight).start(0);
				}
				bottomContainer.style.height = "";
				state = 1;
		}
	}

	function close() {
		if (!state) return;
		state = 0;
		if (preload) preload.onload = Class.empty;
		for (var f in fx) fx[f].stop();
		$$(center, bottomContainer).setStyle("display", "none");
		fx.overlay.chain(setup.pass(false)).start(0);
	}

})();


// Add Slimbox functionality with default options to all links with a rel attribute starting with "lightbox" on page load, for Lightbox compatibility.
// You may remove this block if you only want to specify manually which links you want to be handled by Slimbox.
window.addEvent("domready", function() {
	var links = [];
	$$("a").forEach(function(el) {
		if (el.rel && el.rel.test(/^lightbox/i)) links.push(el);
	});
	// You may override the default options by putting your values inside the following {}
	$$(links).slimbox({}, true);
});
