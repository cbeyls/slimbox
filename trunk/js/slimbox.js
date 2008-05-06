/*
	Slimbox v1.41-dev - The ultimate lightweight Lightbox clone
	by Christophe Beyls (http://www.digitalia.be) - MIT-style license.
	Inspired by the original Lightbox v2 by Lokesh Dhakar.
*/

var Slimbox = {

	anchors: [],

	state: 0,	// State values: 0 (closed or closing), 1 (open and ready), 2+ (open and busy with animation)

	init: function(options) {
		this.options = $extend({
			resizeDuration: 400,			// Duration of each of the box resize animations (in milliseconds)
			resizeTransition: false,		// Default transition in mootools
			initialWidth: 250,			// Initial width of the box (in pixels)
			initialHeight: 250,			// Initial height of the box (in pixels)
			animateCaption: true,
			showCounter: true,			// If true, a counter will only be shown if there is more than 1 image to display
			counterText: "Image {x} of {y}"		// Translate or change as you wish
		}, options || {});

		$each(document.links, function(el) {
			if (el.rel && el.rel.test(/^lightbox/i)) {
				el.onclick = this.click.pass(el, this);
				this.anchors.push(el);
			}
		}, this);
		this.eventKeyDown = this.keyDown.bindAsEventListener(this);
		this.eventPosition = this.position.bind(this);

		this.overlay = new Element("div", {id: "lbOverlay"}).injectInside(document.body);

		this.center = new Element("div", {id: "lbCenter", styles: {width: this.options.initialWidth, height: this.options.initialHeight, marginLeft: -(this.options.initialWidth/2), display: "none"}}).injectInside(document.body);
		this.image = new Element("div", {id: "lbImage"}).injectInside(this.center);
		this.prevLink = new Element("a", {id: "lbPrevLink", href: "#", styles: {display: "none"}}).injectInside(this.image);
		this.nextLink = this.prevLink.clone().setProperty("id", "lbNextLink").injectInside(this.image);
		this.prevLink.onclick = this.previous.bind(this);
		this.nextLink.onclick = this.next.bind(this);

		this.bottomContainer = new Element("div", {id: "lbBottomContainer", styles: {display: "none"}}).injectInside(document.body);
		this.bottom = new Element("div", {id: "lbBottom"}).injectInside(this.bottomContainer);
		new Element("a", {id: "lbCloseLink", href: "#"}).injectInside(this.bottom).onclick = this.overlay.onclick = this.close.bind(this);
		this.caption = new Element("div", {id: "lbCaption"}).injectInside(this.bottom);
		this.number = new Element("div", {id: "lbNumber"}).injectInside(this.bottom);
		new Element("div", {styles: {clear: "both"}}).injectInside(this.bottom);

		var nextEffect = this.nextEffect.bind(this);
		this.fx = {
			overlay: this.overlay.effect("opacity", {duration: 500}).hide(),
			resize: this.center.effects($extend({duration: this.options.resizeDuration, onComplete: nextEffect}, this.options.resizeTransition ? {transition: this.options.resizeTransition} : {})),
			image: this.image.effect("opacity", {duration: 500, onComplete: nextEffect}),
			bottom: this.bottom.effect("margin-top", {duration: 400, onComplete: nextEffect})
		};

		this.preloadPrev = new Image();
		this.preloadNext = new Image();
	},

	click: function(link) {
		if (link.rel.length == 8) return this.show(link.href, link.title);

		var j, imageNum, images = [];
		this.anchors.forEach(function(el, i) {
			if (el.rel == link.rel) {
				images.push([el.href, el.title]);
				if (el.href == link.href) imageNum = i;
			}
		}, this);
		return this.open(images, imageNum);
	},

	open: function(images, startImage) {
		// The function is called for a single image, with URL and Title as first two arguments
		if (typeof images == "string") {
			images = [[images,startImage]];
			startImage = 0;
		}

		this.images = images;
		this.position();
		this.setup(true);
		this.top = window.getScrollTop() + (window.getHeight() / 15);
		this.center.setStyles({top: this.top, display: ""});
		this.fx.overlay.start(0.8);
		return this.changeImage(startImage);
	},

	position: function() {
		this.overlay.setStyles({top: window.getScrollTop(), height: window.getHeight()});
	},

	setup: function(open) {
		var elements = $A(document.getElementsByTagName("object"));
		elements.extend(document.getElementsByTagName(window.ie ? "select" : "embed"));
		elements.each(function(el) {
			if (open) el.lbBackupStyle = el.style.visibility;
			el.style.visibility = open ? "hidden" : el.lbBackupStyle;
		});
		var fn = open ? "addEvent" : "removeEvent";
		window[fn]("scroll", this.eventPosition)[fn]("resize", this.eventPosition);
		document[fn]("keydown", this.eventKeyDown);
	},

	keyDown: function(event) {
		switch(event.keyCode) {
			case 27:	// Esc
			case 88:	// 'x'
			case 67:	// 'c'
				this.close();
				break;
			case 37:	// Left arrow
			case 80:	// 'p'
				this.previous();
				break;	
			case 39:	// Right arrow
			case 78:	// 'n'
				this.next();
		}
	},

	previous: function() {
		return this.changeImage(this.activeImage - 1);
	},

	next: function() {
		return this.changeImage(this.activeImage + 1);
	},

	changeImage: function(imageNum) {
		if ((this.state > 1) || (imageNum < 0) || (imageNum >= this.images.length)) return false;
		this.state = 2;
		this.activeImage = imageNum;

		this.bottomContainer.style.display = this.prevLink.style.display = this.nextLink.style.display = "none";
		this.fx.image.hide();
		this.center.className = "lbLoading";

		this.preload = new Image();
		this.preload.onload = this.nextEffect.bind(this);
		this.preload.src = this.images[imageNum][0];
		return false;
	},

	nextEffect: function() {
		switch (this.state++) {
			case 2:
				this.center.className = "";
				this.image.style.backgroundImage = "url(" + this.images[this.activeImage][0] + ")";
				this.image.style.width = this.bottom.style.width = this.preload.width + "px";
				this.image.style.height = this.prevLink.style.height = this.nextLink.style.height = this.preload.height + "px";

				this.caption.setHTML(this.images[this.activeImage][1] || "");
				this.number.setHTML((this.options.showCounter && (this.images.length > 1)) ? this.options.counterText.replace(/{x}/, this.activeImage + 1).replace(/{y}/, this.images.length) : "");

				if (this.activeImage) this.preloadPrev.src = this.images[this.activeImage - 1][0];
				if (this.activeImage != (this.images.length - 1)) this.preloadNext.src = this.images[this.activeImage + 1][0];
				if (this.center.clientHeight != this.image.offsetHeight) {
					this.fx.resize.start({height: this.image.offsetHeight});
					break;
				}
				this.state++;
			case 3:
				if (this.center.clientWidth != this.image.offsetWidth) {
					this.fx.resize.start({width: this.image.offsetWidth, marginLeft: -this.image.offsetWidth/2});
					break;
				}
				this.state++;
			case 4:
				this.bottomContainer.setStyles({top: this.top + this.center.clientHeight, height: 0, marginLeft: this.center.style.marginLeft, display: ""});
				this.fx.image.start(1);
				break;
			case 5:
				if (this.options.animateCaption) {
					this.fx.bottom.set(-this.bottom.offsetHeight);
					this.bottomContainer.style.height = "";
					this.fx.bottom.start(0);
					break;
				}
				this.bottomContainer.style.height = "";
			case 6:
				if (this.activeImage) this.prevLink.style.display = "";
				if (this.activeImage != (this.images.length - 1)) this.nextLink.style.display = "";
				this.state = 1;
		}
	},

	close: function() {
		if (!this.state) return;
		this.state = 0;
		if (this.preload) {
			this.preload.onload = Class.empty;
			this.preload = null;
		}
		for (var f in this.fx) this.fx[f].stop();
		this.center.style.display = this.bottomContainer.style.display = "none";
		this.fx.overlay.chain(this.setup.pass(false, this)).start(0);
		return false;
	}
};

window.addEvent("domready", Slimbox.init.bind(Slimbox));
