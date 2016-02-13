module.exports = function(grunt) {
	grunt.initConfig({
		inline: {
			dist: {
				options:{
					cssmin: true,
					tag: '',
					uglify: true
				},
				src: 'index.html',
				dest: 'dist/index.html'
			}
		},
	});
	grunt.loadNpmTasks('grunt-inline');
	grunt.registerTask('default', ['inline']);
};