/*!
	Slimbox v1.58 - The ultimate lightweight Lightbox clone
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

var Slimbox = (function() {

	// Global variables, accessible to Slimbox only
	var win = window, options, images, activeImage = -1, activeURL, prevImage, nextImage, compatibleOverlay, middle, centerWidth, centerHeight,
		eventKeyDown = keyDown.bindWithEvent(), operaFix = window.opera && (navigator.appVersion >= "9.3"), documentElement = document.documentElement,

	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),

	// DOM elements
	overlay, center, image, prevLink, nextLink, bottomContainer, bottom, caption, number,

	// Effects
	fxOverlay, fxResize, fxImage, fxBottom;

	/*
		Initialization
	*/

	win.addEvent("domready", function() {
		// Append the Slimbox HTML code at the bottom of the document
		$(document.body).adopt(
			$$(
				overlay = new Element("div", {id: "lbOverlay"}),
				center = new Element("div", {id: "lbCenter"}),
				bottomContainer = new Element("div", {id: "lbBottomContainer"})
			).setStyle("display", "none")
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
	});


	/*
		Internal functions
	*/

	function position() {
		var l = win.getScrollLeft(), w = operaFix ? documentElement.clientWidth : win.getWidth();
		$$(center, bottomContainer).setStyle("left", l + (w / 2));
		if (compatibleOverlay) overlay.setStyles({left: l, top: win.getScrollTop(), width: w, height: win.getHeight()});
	}

	function setup(open) {
		["object", win.ie6 ? "select" : "embed"].forEach(function(tag) {
			$each(document.getElementsByTagName(tag), function(el) {
				if (open) el._slimbox = el.style.visibility;
				el.style.visibility = open ? "hidden" : el._slimbox;
			});
		});

		overlay.style.display = open ? "" : "none";

		var fn = open ? "addEvent" : "removeEvent";
		win[fn]("scroll", position)[fn]("resize", position);
		document[fn]("keydown", eventKeyDown);
	}

	function keyDown(event) {
		var code = event.code;
		if (options.closeKeys.contains(code)) close();
		else if (options.nextKeys.contains(code)) next();
		else if (options.previousKeys.contains(code)) previous();
		// Prevent default keyboard action (like navigating inside the page)
		event.stop();
	}

	function previous() {
		return changeImage(prevImage);
	}

	function next() {
		return changeImage(nextImage);
	}

	function changeImage(imageIndex) {
		if (imageIndex >= 0) {
			activeImage = imageIndex;
			activeURL = images[imageIndex][0];
			prevImage = (activeImage || (options.loop ? images.length : 0)) - 1;
			nextImage = ((activeImage + 1) % images.length) || (options.loop ? 0 : -1);

			stop();
			center.className = "lbLoading";

			preload = new Image();
			preload.onload = animateBox;
			preload.src = activeURL;
		}

		return false;
	}

	function animateBox() {
		center.className = "";
		fxImage.set(0);
		image.setStyles({width: preload.width, backgroundImage: "url(" + activeURL + ")", display: ""});
		$$(image, prevLink, nextLink).setStyle("height", preload.height);

		caption.setHTML(images[activeImage][1] || "");
		number.setHTML((((images.length > 1) && options.counterText) || "").replace(/{x}/, activeImage + 1).replace(/{y}/, images.length));

		if (prevImage >= 0) preloadPrev.src = images[prevImage][0];
		if (nextImage >= 0) preloadNext.src = images[nextImage][0];

		centerWidth = image.offsetWidth;
		centerHeight = image.offsetHeight;
		var top = Math.max(0, middle - (centerHeight / 2));
		if (center.offsetHeight != centerHeight) {
			fxResize.chain(fxResize.start.pass({height: centerHeight, top: top}, fxResize));
		}
		if (center.offsetWidth != centerWidth) {
			fxResize.chain(fxResize.start.pass({width: centerWidth, marginLeft: -centerWidth/2}, fxResize));
		}
		fxResize.chain(function() {
			bottomContainer.setStyles({width: centerWidth, top: top + centerHeight, marginLeft: -centerWidth/2, visibility: "hidden", display: ""});
			fxImage.start(1);
		});
		fxResize.callChain();
	}

	function animateCaption() {
		if (prevImage >= 0) prevLink.style.display = "";
		if (nextImage >= 0) nextLink.style.display = "";
		fxBottom.set(-bottom.offsetHeight).start(0);
		bottomContainer.style.visibility = "";
	}

	function stop() {
		preload.onload = Class.empty;
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		fxResize.clearChain();
		fxResize.stop();
		fxImage.stop();
		fxBottom.stop();
		$$(prevLink, nextLink, image, bottomContainer).setStyle("display", "none");
	}

	function close() {
		if (activeImage >= 0) {
			stop();
			activeImage = prevImage = nextImage = -1;
			center.style.display = "none";
			fxOverlay.stop().chain(setup).start(0);
		}

		return false;
	}


	/*
		API
	*/

	Element.extend({
		slimbox: function(_options, linkMapper) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).slimbox(_options, linkMapper);

			return this;
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
				link.removeEvents("click").addEvent("click", function(event) {
					// Build the list of images that will be displayed
					var filteredLinks = links.filter(linksFilter, this);
					Slimbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
					event.stop();
				}.bindWithEvent(link));
			});

			return links;
		}
	});

	return {
		open: function(_images, startImage, _options) {
			options = $extend({
				loop: false,				// Allows to navigate between first and last images
				overlayOpacity: 0.8,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
				overlayFadeDuration: 400,		// Duration of the overlay fade-in and fade-out animations (in milliseconds)
				resizeDuration: 400,			// Duration of each of the box resize animations (in milliseconds)
				resizeTransition: false,		// "false" uses the mootools default transition
				initialWidth: 250,			// Initial width of the box (in pixels)
				initialHeight: 250,			// Initial height of the box (in pixels)
				imageFadeDuration: 400,			// Duration of the image fade-in animation (in milliseconds)
				captionAnimationDuration: 400,		// Duration of the caption animation (in milliseconds)
				counterText: "Image {x} of {y}",	// Translate or change as you wish
				closeKeys: [27, 88, 67],		// Array of keycodes to close Slimbox, default: Esc (27), 'x' (88), 'c' (67)
				previousKeys: [37, 80],			// Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
				nextKeys: [39, 78]			// Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
			}, _options || {});

			// Setup effects
			fxOverlay = overlay.effect("opacity", {duration: options.overlayFadeDuration});
			fxResize = center.effects($extend({duration: options.resizeDuration}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			fxImage = image.effect("opacity", {duration: options.imageFadeDuration, onComplete: animateCaption});
			fxBottom = bottom.effect("margin-top", {duration: options.captionAnimationDuration});

			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == "string") {
				_images = [[_images, startImage]];
				startImage = 0;
			}

			middle = win.getScrollTop() + ((operaFix ? documentElement.clientHeight : win.getHeight()) / 2);
			centerWidth = options.initialWidth;
			centerHeight = options.initialHeight;
			center.setStyles({top: Math.max(0, middle - (centerHeight / 2)), width: centerWidth, height: centerHeight, marginLeft: -centerWidth/2, display: ""});
			compatibleOverlay = win.ie6 || (overlay.currentStyle && (overlay.currentStyle.position != "fixed"));
			if (compatibleOverlay) overlay.style.position = "absolute";
			fxOverlay.set(0).start(options.overlayOpacity);
			position();
			setup(1);

			images = _images;
			options.loop = options.loop && (images.length > 1);
			return changeImage(startImage);
		}
	};

})();