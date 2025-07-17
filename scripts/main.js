// initialise fullpage.js
new fullpage('#fullpage', {
  licenseKey: 'OPEN-SOURCE-GPLV3-LICENSE',
  anchors: ['charts'],
  sectionsColor: ['#a5ad92ff'],
  autoScrolling: true,
  fitToSection: true,
  slidesNavigation: true,
  slidesNavPosition: 'top',
  scrollOverflow: true,
});

const jsonCache = {};
d3.cachedJson = function(url, key, callback) {
  if (jsonCache[key]) {
    callback(JSON.parse(jsonCache[key]));
  } else {
    d3.json(url).then(json => {
      jsonCache[key] = JSON.stringify(json);
      callback(json);
    });
  }
};
