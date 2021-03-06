var _ = require('lodash'),
    nunjucks = require('nunjucks'),
    nconf = require('nconf');

//settings
nconf.env();
if(nconf.get('settings')) {
  var settings = require(nconf.get('settings'));
  console.log('using settings file:',nconf.get('settings'));
}
else {
  var settings = require('./settings.json');
  console.log('using default settings');
}

var __basename = _.trimEnd(__dirname,'src');
var env = nunjucks.configure( __basename + 'templates/', {
    autoescape: false,
    cache: false
})
.addFilter('arrayPush', require('./filters/arrayPush.filter.js'))
.addGlobal('site',settings);

var tags = [
    'gallery',
    'figure'
];

function find_tags(post) {
  for(var i in tags) {
      var regexp = new RegExp('<p>\\s*\\(' + tags[i] + '([^\\)]+)?\\)\\s*<\\/p>','igm');
      //var match;
      while(match = regexp.exec(post.html_body)) {
          //call the custom function for this tag.
          var compiled_tag = global['smart_tag_' + tags[i]](post,match[0],get_options(match[1]));
          //replace this occurance of the tag with the compiled_tag
          post.html_body = post.html_body.replace(match[0],compiled_tag);
      }
  }
  return post.html_body;
};

function get_options(match) {
    var terms = [];
    var items = _.trim(match).split(',');
    for(var i in items) {
        terms.push(items[i].split(':'));
    }
    return _.fromPairs(terms);
};

//smart tag definitions, what to do with a smart tag once it's been matched?
//Always defined as `smart_tag_[tag-name]`
smart_tag_gallery = function (post,string,opts) {
    var images_for_gallery = {"images":[],"type":post.attributes.type};

    //loop through the available images for this post
    //and see if any are to be used by this gallery
    for(var i in post.attributes.images) {
        if(post.attributes.images[i].set === opts.set) {
            images_for_gallery["images"].push(post.attributes.images[i]);
        }
    }
    gallery_rendered = env.render('patterns/modules/m_gallery/m_gallery.smartTag',images_for_gallery);
    return gallery_rendered;

};

smart_tag_figure = function (post,string,opts) {
  var figure_object = {"images":[],"type":post.attributes.type};

  for(var i in post.attributes.images) {
    if(post.attributes.images[i].set === opts.set) {
      figure_object["images"].push(post.attributes.images[i]);
    }
  };
  var figure_rendered = env.render('patterns/modules/m_figure/m_figure.smartTag',figure_object);
  return figure_rendered;
};

module.exports.find_tags = find_tags;
