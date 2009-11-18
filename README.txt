SLIMBOX V1.58 README
====================
(c) Christophe Beyls 2007-2009

http://code.google.com/p/slimbox/

Included files:

example.html		A simple example page demonstrating how to use Slimbox with the default configuration.
example.jpg		An example image used on the example page.
README.txt		The file you are reading.
css/*			The Slimbox stylesheet and its associated images. You can edit them to customize Slimbox appearance.
js/mootools.js		The minified version of mootools v1.11 including only the modules required by Slimbox.
js/slimbox.js		The minified version of Slimbox, plus the editable autoloading code using default options.
src/slimbox.js		The Slimbox source. Contains comments and is not suitable for production use (needs to be minified first).
extra/*			Some extra scripts that you can add to the autoload code block inside slimbox.js to add special functionality.


---
ADDITIONAL REQUIREMENT FOR THIS VERSION, WHICH USES MOOTOOLS 1.1X:

Make sure that there is an XHTML DOCTYPE declaration at the *very top* of the HTML pages where you want to use Slimbox,
so the browser will work in standards-compliant mode.
The DOCTYPE must be XHTML 1.0 transitional, XHTML 1.0 strict or XHTML 1.1. Example, for XHTML 1.0 transitional:

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

*Important*: Do *not* add an XML prolog before the DOCTYPE.
If you add one, Internet Explorer 6 will not work in standards-compliant mode and Slimbox will not display correctly in this browser.
---

You can use the provided mootools.js and slimbox.js scripts "as is", or you can use a custom mootools build
downloaded from the official mootools website and/or edit the autoloading code inside slimbox.js.

You need to download a new mootools version if your web page scripts require additional mootools modules,
or if you want to use a different version of mootools.

Here are the mootools modules required by this version of Slimbox:
- Class: _all_
- Native: _all_
- Element: Element.Event
- Window: Window.DomReady, Window.Size
- Effects: Fx.Style, Fx.Styles (optionally Fx.Transitions)

You can remove or customize the provided autoload code block by editing the slimbox.js file. By default, it behaves like Lightbox.
When deploying slimbox.js, you MUST always preserve the copyright notice at the beginning of the file.

If you are a developer and want to edit the provided Slimbox source code, it is strongly recommended to minify the script using "YUI Compressor"
by Julien Lecomte before distribution. It will strip spaces and comments and shrink the variable names in order to obtain the smallest file size.

For more information, please read the documentation on the official project page.


Enjoy!