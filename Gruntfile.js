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
		'string-replace': {
		  dist: {
			files: {
			  'build/': 'node_modules/bootstrap/dist/**',
			},
			options: {
			  replacements: [{
				pattern: /fonts\/glyphicons-halflings-regular\.svg#glyphicons_halflingsregular/ig,
				replacement: 'fonts/glyphicons-halflings-regular.svg'
			  }]
			}
		  }
		},
		cssUrlEmbed: {
		  encodeDirectly: {
			options: {
			  baseDir: './node_modules/bootstrap/dist/css/'
			},
			files: {
			  'build/css/bootstrap.css': ['build/node_modules/bootstrap/dist/css/bootstrap.css']
			}
		  }
		},
		clean: ["build", "dist"]
	});
	grunt.loadNpmTasks('grunt-inline');
	grunt.loadNpmTasks('grunt-css-url-embed');
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.registerTask('default', ['clean','string-replace','cssUrlEmbed','inline']);
};