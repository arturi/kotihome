var camera = {
	timer: '',
	capture: function() {
		shell.exec('./webcam.sh', {silent: true});
	},
	setTimer: function(time) {
		camera.timer = setInterval(camera.capture, time);
	}
};

module.exports = camera;