/*!
	Slimbox v1.5 - The ultimate lightweight Lightbox clone
	(c) 2007-2008 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

var Slimbox;

(function() {

	// Global variables, accessible to Slimbox only
	var state = 0, options, images, activeImage, top, eventKeyDown, fx, preload, preloadPrev = new Image(), preloadNext = new Image(),
	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)

	// DOM elements
	overlay, center, image, prevLink, nextLink, bottomContainer, bottom, caption, number;

	/*
		Initialization
	*/

	window.addEvent("domready", function() {
		eventKeyDown = keyDown.bindWithEvent();

		// Append the Slimbox HTML code at the bottom of the document
		$(document.body).adopt(
			$$([
				overlay = new Element("div", {id: "lbOverlay"}),
				center = new Element("div", {id: "lbCenter"}),
				bottomContainer = new Element("div", {id: "lbBottomContainer"})
			]).setStyle("display", "none")
		);

		image = new Element("div", {id: "lbImage"}).injectInside(center).adopt(
			prevLink = new Element("a", {id: "lbPrevLink", href: "#"}),
			nextLink = new Element("a", {id: "lbNextLink", href: "#"})
		);
		prevLink.onclick = previous;
		nextLink.onclick = next;

		var closeLink;
		bottom = new Element("div", {id: "lbBottom"}).injectInside(bottomContainer).adopt(
			closeLink = new Element("a", {id: "lbCloseLink", href: "#"}),
			caption = new Element("div", {id: "lbCaption"}),
			number = new Element("div", {id: "lbNumber"}),
			new Element("div", {styles: {clear: "both"}})
		);
		closeLink.onclick = overlay.onclick = close;

		fx = {
			overlay: overlay.effect("opacity", {duration: 500}).set(0),
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
			return changeImage(startImage);
		}
	};

	Element.extend({
		slimbox: function(_options, linkMapper) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).slimbox(_options, linkMapper);
		}
	});

	Elements.extend({
		/*
			options:	Optional options object, see Slimbox.open()
			linkMapper:	Optional function taking a link DOM element and an index as arguments and returning an array containing 2 elements:
					the image URL and the image caption (may contain HTML)
			linksFilter:	Optional function taking a link DOM element and an index as arguments and returning true if the element is part of
					the image collection that will be shown on click, false if not. "this" refers to the element that was clicked.
					This function must always return true when the DOM element argument is "this".
		*/
		slimbox: function(_options, linkMapper, linksFilter) {
			linkMapper = linkMapper || function(el) {
				return [el.href, el.title];
			};

			linksFilter = linksFilter || function() {
				return true;
			};

			var links = this;

			links.forEach(function(link) {
				link.onclick = function() {
					// Build the list of images that will be displayed
					var filteredLinks = links.filter(linksFilter, this);
					return Slimbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
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

		overlay.style.display = open ? "" : "none";

		var fn = open ? "addEvent" : "removeEvent";
		window[fn]("scroll", position)[fn]("resize", position);
		document[fn]("keydown", eventKeyDown);
	}

	function keyDown(event) {
		switch(event.code) {
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
		// Prevent default keyboard action (like navigating inside the page)
		event.preventDefault();
	}

	function previous() {
		return changeImage(activeImage - 1);
	}

	function next() {
		return changeImage(activeImage + 1);
	}

	function changeImage(imageIndex) {
		if ((state > 1) || (imageIndex < 0) || (imageIndex >= images.length)) return false;
		state = 2;
		activeImage = imageIndex;

		$$(prevLink, nextLink, bottomContainer).setStyle("display", "none");
		fx.bottom.stop().set(0);
		fx.image.set(0);
		center.className = "lbLoading";

		preload = new Image();
		preload.onload = nextEffect;
		preload.src = images[imageIndex][0];

		return false;
	}

	function nextEffect() {
		switch (state++) {
			case 2:
				center.className = "";
				image.style.backgroundImage = "url(" + images[activeImage][0] + ")";
				$$(image, bottom).setStyle("width", preload.width);
				$$(image, prevLink, nextLink).setStyle("height", preload.height);

				caption.setHTML(images[activeImage][1] || "");
				number.setHTML((options.showCounter && (images.length > 1)) ? options.counterText.replace(/{x}/, activeImage + 1).replace(/{y}/, images.length) : "");

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
				if (activeImage < (images.length - 1)) nextLink.style.display = "";
				if (options.animateCaption) {
					fx.bottom.set(-bottom.offsetHeight).start(0);
				}
				bottomContainer.style.height = "";
				state = 1;
		}
	}

	function close() {
		if (!state) return false;
		state = 0;
		preload.onload = Class.empty;
		for (var f in fx) fx[f].stop();
		$$(center, bottomContainer).setStyle("display", "none");
		fx.overlay.chain(setup).start(0);

		return false;
	}

})();
