/*!
	Slimbox v1.54 - The ultimate lightweight Lightbox clone
	(c) 2007-2008 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

var Slimbox;

(function() {

	// Global variables, accessible to Slimbox only
	var win = window, state = 0, options, images, activeImage, prevImage, nextImage, compatibleOverlay, top, eventKeyDown, preload, preloadPrev = new Image(), preloadNext = new Image(),
	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)

	// DOM elements
	overlay, center, image, prevLink, nextLink, bottomContainer, bottom, caption, number,

	// Effects
	fxOverlay, fxResize, fxImage, fxBottom;

	/*
		Initialization
	*/

	win.addEvent("domready", function() {
		eventKeyDown = keyDown.bindWithEvent();

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
		API
	*/

	Slimbox = {
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
				showCounter: true,			// If true, a counter will only be shown if there is more than 1 image to display
				counterText: "Image {x} of {y}"		// Translate or change as you wish
			}, _options || {});

			// Setup effects
			fxOverlay = overlay.effect("opacity", {duration: options.overlayFadeDuration});
			fxResize = center.effects($extend({duration: options.resizeDuration, onComplete: nextEffect}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			fxImage = image.effect("opacity", {duration: options.imageFadeDuration, onComplete: nextEffect});
			fxBottom = bottom.effect("margin-top", {duration: options.captionAnimationDuration});

			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == "string") {
				_images = [[_images,startImage]];
				startImage = 0;
			}

			top = win.getScrollTop() + (win.getHeight() / 15);
			fxOverlay.set(0).start(options.overlayOpacity);
			center.setStyles({top: top, width: options.initialWidth, height: options.initialHeight, marginLeft: -(options.initialWidth/2), display: ""});
			compatibleOverlay = overlay.currentStyle && (overlay.currentStyle.position != "fixed");
			if (compatibleOverlay) overlay.style.position = "absolute";
			position();
			setup(true);

			state = 1;
			images = _images;
			options.loop = options.loop && (images.length > 1);
			return changeImage(startImage);
		}
	};

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
				link.onclick = function() {
					// Build the list of images that will be displayed
					var filteredLinks = links.filter(linksFilter, this);
					return Slimbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
				};
			});

			return links;
		}
	});


	/*
		Internal functions
	*/

	function position() {
		var l = win.getScrollLeft(), w = win.getWidth();
		$$(center, bottomContainer).setStyle("left", l + (w / 2));
		if (compatibleOverlay) overlay.setStyles({left: l, top: win.getScrollTop(), width: w, height: win.getHeight()});
	}

	function setup(open) {
		["object", win.ie ? "select" : "embed"].forEach(function(tag) {
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
		return changeImage(prevImage);
	}

	function next() {
		return changeImage(nextImage);
	}

	function changeImage(imageIndex) {
		if ((state == 1) && (imageIndex >= 0)) {
			state = 2;
			activeImage = imageIndex;
			prevImage = ((activeImage || !options.loop) ? activeImage : images.length) - 1;
			nextImage = activeImage + 1;
			if (nextImage == images.length) nextImage = options.loop ? 0 : -1;

			$$(prevLink, nextLink, image, bottomContainer).setStyle("display", "none");
			fxBottom.stop().set(0);
			fxImage.set(0);
			center.className = "lbLoading";

			preload = new Image();
			preload.onload = nextEffect;
			preload.src = images[imageIndex][0];
		}

		return false;
	}

	function nextEffect() {
		switch (state++) {
			case 2:
				center.className = "";
				image.setStyles({backgroundImage: "url(" + images[activeImage][0] + ")", display: ""});
				$$(image, bottom).setStyle("width", preload.width);
				$$(image, prevLink, nextLink).setStyle("height", preload.height);

				caption.setHTML(images[activeImage][1] || "");
				number.setHTML((options.showCounter && (images.length > 1)) ? options.counterText.replace(/{x}/, activeImage + 1).replace(/{y}/, images.length) : "");

				if (prevImage >= 0) preloadPrev.src = images[prevImage][0];
				if (nextImage >= 0) preloadNext.src = images[nextImage][0];

				if (center.clientHeight != image.offsetHeight) {
					fxResize.start({height: image.offsetHeight});
					break;
				}
				state++;
			case 3:
				if (center.clientWidth != image.offsetWidth) {
					fxResize.start({width: image.offsetWidth, marginLeft: -image.offsetWidth/2});
					break;
				}
				state++;
			case 4:
				bottomContainer.setStyles({top: top + center.clientHeight, marginLeft: center.style.marginLeft, visibility: "hidden", display: ""});
				fxImage.start(1);
				break;
			case 5:
				if (prevImage >= 0) prevLink.style.display = "";
				if (nextImage >= 0) nextLink.style.display = "";
				fxBottom.set(-bottom.offsetHeight).start(0);
				bottomContainer.style.visibility = "";
				state = 1;
		}
	}

	function close() {
		if (state) {
			state = 0;
			preload.onload = Class.empty;
			[fxOverlay, fxResize, fxImage, fxBottom].forEach(function(fx) {
				fx.stop();
			});
			$$(center, bottomContainer).setStyle("display", "none");
			fxOverlay.chain(setup).start(0);
		}

		return false;
	}

})();