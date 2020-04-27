/*
 * View model for OctoPrint-Fullscreen
 *
 * Based on: NavbarTemp credits to Jarek Szczepanski
 * (Other stuff) Author: Paul de Vries
 * License: AGPLv3
 */
var onceOpenInlineFullscreen = false;
if (window.location.hash.indexOf('-fullscreen-open') !== -1) {
	window.location.hash = window.location.hash.replace('-fullscreen-open', '').substr(1);
	onceOpenInlineFullscreen = true;
}

$(function() {
	function FullscreenViewModel(parameters) {
		var self = this;
		var $webcam = $('#webcam_image');
		var $info = $('#fullscreen-bar');
		var $body = $('body');
		var $container, $fullscreenContainer;

		var containerPlaceholder = document.getElementById('webcam') ? '#webcam' : '#webcam_container';
		if ($('.webcam_fixed_ratio').length > 0) {
			$container = $(containerPlaceholder + ' .webcam_fixed_ratio');
			$fullscreenContainer = $(containerPlaceholder + ' #webcam_rotator');
		} else {
			$container = $(containerPlaceholder + ' #webcam_rotator');
			$fullscreenContainer = $(containerPlaceholder + ' #webcam_container');
		}

		self.tempModel = parameters[0];
		self.printer = parameters[2];
		self.settings = parameters[1];

		self.printer.printLayerProgress = ko.observable('');
		self.printer.hasLayerProgress = ko.observable(false);

		self.printer.isFullscreen = ko.observable(false);
		self.printer.fullscreen = function() {
			$fullscreenContainer.toggleFullScreen();
		}

		self.onStartupComplete = function() {
			if (onceOpenInlineFullscreen) {
				setTimeout(function() {
					touchtime = new Date().getTime();
					$webcam.trigger("click");
					onceOpenInlineFullscreen = false;
				}, 0);
			}
		}

		self.onDataUpdaterPluginMessage = function (plugin, data) {
			if (plugin.indexOf('DisplayLayerProgress') !== -1) {
				if (!self.printer.hasLayerProgress()) {
					self.printer.hasLayerProgress(true);
				}

				if (data.currentLayer && data.totalLayer) {
					self.printer.printLayerProgress(data.currentLayer + ' / ' + data.totalLayer);
				}
			}
		};

		self.formatBarTemperatureFullscreen = function(toolName, actual, target) {
			var output = toolName + ": " + _.sprintf("%.1f&deg;C", actual);

			if (target) {
				var sign = (target >= actual) ? " \u21D7 " : " \u21D8 ";
				output += sign + _.sprintf("%.1f&deg;C", target);
			}

			return output;
		};

		var touchtime = 0;
		$webcam.on("click", function() {
			if (touchtime === 0) {
				touchtime = new Date().getTime();
			} else {
				if (((new Date().getTime()) - touchtime) < 800) {
					$body.toggleClass('inlineFullscreen');
					$container.toggleClass("inline fullscreen");

					if ($body.hasClass('inlineFullscreen')) {
						history.pushState('', null, window.location.hash + '-fullscreen-open');
					} else {
						if (window.location.hash.indexOf('-fullscreen-open') !== -1) {
							history.pushState('', null, window.location.hash.replace('-fullscreen-open', ''));
						}
					}

					if(self.printer.isFullscreen()) {
						$fullscreenContainer.toggleFullScreen();
					}
					touchtime = 0;
				} else {
					touchtime = new Date().getTime();
				}
			}
		});

		$(document).bind("fullscreenchange", function() {
			self.printer.isFullscreen($(document).fullScreen());
		});

		$info.insertAfter($container);
		$(".print-control #job_pause").clone().appendTo("#fullscreen-bar .user-buttons").attr('id', 'job_pause_clone');

		ko.applyBindings(self.printer, $("#fullscreen-bar #fullscreen-cancel").get(0));
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: FullscreenViewModel,
		dependencies: ["temperatureViewModel", "settingsViewModel", "printerStateViewModel"],
		optional: [],
		elements: ["#fullscreen-info"]
	});
});
