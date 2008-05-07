/*
	Slimbox v1.41-dev - The ultimate lightweight Lightbox clone
	by Christophe Beyls (http://www.digitalia.be) - MIT-style license.
	Inspired by the original Lightbox v2 by Lokesh Dhakar.
*/

var Slimbox = {};

(function() {

	var anchors = [], state = 0, options, images, activeImage, top, eventKeydown, fx, preload, preloadPrev, preloadNext;
	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)

	var overlay, center, image, prevLink, nextLink, bottomContainer, bottom, caption, number;

	// Slimbox initialization
	window.addEvent("domready", function(_options) {
		options = $extend({
			resizeDuration: 400,			// Duration of each of the box resize animations (in milliseconds)
			resizeTransition: false,		// Default transition in mootools
			initialWidth: 250,			// Initial width of the box (in pixels)
			initialHeight: 250,			// Initial height of the box (in pixels)
			animateCaption: true,
			showCounter: true,			// If true, a counter will only be shown if there is more than 1 image to display
			counterText: "Image {x} of {y}"		// Translate or change as you wish
		}, _options || {});

		$each(document.links, function(el) {
			if (el.rel && el.rel.test(/^lightbox/i)) {
				el.onclick = click;
				anchors.push(el);
			}
		});
		eventKeyDown = keyDown.create({event: true});

		overlay = new Element("div", {id: "lbOverlay"}).injectInside(document.body);

		center = new Element("div", {id: "lbCenter", styles: {width: options.initialWidth, height: options.initialHeight, marginLeft: -(options.initialWidth/2), display: "none"}}).injectInside(document.body);
		image = new Element("div", {id: "lbImage"}).injectInside(center);
		prevLink = new Element("a", {id: "lbPrevLink", href: "#", styles: {display: "none"}}).injectInside(image);
		nextLink = prevLink.clone().setProperty("id", "lbNextLink").injectInside(image);
		prevLink.onclick = previous;
		nextLink.onclick = next;

		bottomContainer = new Element("div", {id: "lbBottomContainer", styles: {display: "none"}}).injectInside(document.body);
		bottom = new Element("div", {id: "lbBottom"}).injectInside(bottomContainer);
		new Element("a", {id: "lbCloseLink", href: "#"}).injectInside(bottom).onclick = overlay.onclick = close;
		caption = new Element("div", {id: "lbCaption"}).injectInside(bottom);
		number = new Element("div", {id: "lbNumber"}).injectInside(bottom);
		new Element("div", {styles: {clear: "both"}}).injectInside(bottom);

		fx = {
			overlay: overlay.effect("opacity", {duration: 500}).hide(),
			resize: center.effects($extend({duration: options.resizeDuration, onComplete: nextEffect}, options.resizeTransition ? {transition: options.resizeTransition} : {})),
			image: image.effect("opacity", {duration: 500, onComplete: nextEffect}),
			bottom: bottom.effect("margin-top", {duration: 400})
		};

		preloadPrev = new Image();
		preloadNext = new Image();
	});

	function click() {
		// Build the list of images that will be displayed
		// startIndex is the image index related to the link that was clicked
		var imageNum, _images = [];
		((this.rel == "lightbox") ? [this] : anchors).forEach(function(el, i) {
			if (el.rel == this.rel) {
				_images.push([el.href, el.title]);
				if (el.href == this.href) imageNum = i;
			}
		}, this);
		return Slimbox.open(_images, imageNum);
	}

	Slimbox.open = function(_images, startImage) {
		// The function is called for a single image, with URL and Title as first two arguments
		if (typeof _images == "string") {
			_images = [[_images,startImage]];
			startImage = 0;
		}

		images = _images;
		position();
		setup(true);
		top = window.getScrollTop() + (window.getHeight() / 15);
		center.setStyles({top: top, display: ""});
		fx.overlay.start(0.8);
		return changeImage(startImage);
	};

	function position() {
		overlay.setStyles({top: window.getScrollTop(), height: window.getHeight()});
	}

	function setup(open) {
		var elements = $A(document.getElementsByTagName("object"));
		elements.extend(document.getElementsByTagName(window.ie ? "select" : "embed"));
		elements.each(function(el) {
			if (open) el.lbBackupStyle = el.style.visibility;
			el.style.visibility = open ? "hidden" : el.lbBackupStyle;
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
		return changeImage(activeImage - 1);
	}

	function next() {
		return changeImage(activeImage + 1);
	}

	function changeImage(imageNum) {
		if ((state > 1) || (imageNum < 0) || (imageNum >= images.length)) return false;
		state = 2;
		activeImage = imageNum;

		bottomContainer.style.display = prevLink.style.display = nextLink.style.display = "none";
		fx.bottom.stop().set(0);
		fx.image.hide();
		center.className = "lbLoading";

		preload = new Image();
		preload.onload = nextEffect;
		preload.src = images[imageNum][0];
		return false;
	}

	function nextEffect() {
		switch (state++) {
			case 2:
				center.className = "";
				image.style.backgroundImage = "url(" + images[activeImage][0] + ")";
				image.style.width = bottom.style.width = preload.width + "px";
				image.style.height = prevLink.style.height = nextLink.style.height = preload.height + "px";

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
		center.style.display = bottomContainer.style.display = "none";
		fx.overlay.chain(setup.pass(false)).start(0);
		return false;
	}

})();
