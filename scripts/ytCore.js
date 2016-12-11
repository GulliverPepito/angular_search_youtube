var BASE_TEN = 10;

angular.module('ytCore', [])

  .constant('YT_VIDEO_URL', 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id={ID}&key=AIzaSyDXi6Vu9T3Gx_yUGMR3v2bN4l_zQl6L72s')
  .constant('YT_VIDEO_COMMENTS_URL',   'https://gdata.youtube.com/feeds/api/videos/{ID}/comments?v=2&alt=json&callback=JSON_CALLBACK')
  .constant('YT_SEARCH_URL', 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyDXi6Vu9T3Gx_yUGMR3v2bN4l_zQl6L72s')
  .constant('YT_RELATED_URL', 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id={ID}&key=AIzaSyDXi6Vu9T3Gx_yUGMR3v2bN4l_zQl6L72s')

  .constant('YT_POPULAR_URL', 'https://gdata.youtube.com/feeds/api/standardfeeds/{FEED}?alt=json&callback=JSON_CALLBACK')
  .constant('YT_EMBED_URL',   'http://www.youtube.com/embed/{ID}?autoplay=1')
  .constant('YT_EMBED_URL_CHANNEL',   'http://www.youtube.com/channel/{ID}')
  .constant('YT_POSTER_URL',   'https://i1.ytimg.com/vi/{ID}/hqdefault.jpg')

  .config(['$sceDelegateProvider', function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://www.youtube.com/**']);
  }])

  .factory('ytFeed', ['ytVideos', 'YT_POPULAR_URL',
              function(ytVideos,   YT_POPULAR_URL) {
    return function(feed) {
      var url = YT_POPULAR_URL.replace('{FEED}', feed);
      return ytVideos(url);
    };
  }])

  .value('ytSearchParams', function(baseUrl, params) {
    var attrs = '';
    angular.forEach(params, function(value, key) {
      if(!value || value.length === 0) {
        return;
      }

      var attr;
      switch(key) {
      case 'q':
        attr = 'q';
        break;

      case 'c':
        attr = 'q';
        break;

      case 'o':
        attr = 'orderby';
        break;

      default:
        return;
      }
      attrs += (baseUrl.indexOf('?') === -1 ? '?' : '&') + attr + '=' + value;
    });
    return baseUrl + attrs;
  })

  .factory('ytSearch', ['ytVideos', 'ytSearchParams', 'YT_SEARCH_URL',
                function(ytVideos,   ytSearchParams,   YT_SEARCH_URL) {
    return function(data) {
      data = typeof data === 'string' ?
        { q : data } :
        data;

      var url = ytSearchParams(YT_SEARCH_URL, data);
      return ytVideos(url);
    };
  }])

  .factory('ytRelatedVideos', ['ytVideos', 'YT_RELATED_URL',
                       function(ytVideos,   YT_RELATED_URL) {
    return function(videoID) {
      return ytVideos(YT_RELATED_URL.replace('{ID}', videoID));
    };
  }])

  .factory('ytVideos', ['$q', '$http', 'ytVideoPrepare',
                function($q,   $http,   ytVideoPrepare) {
    return function(url) {
	  console.log('url'+url);
      var defer = $q.defer();
      $http.get(url)
        .success(function(response) {
          var results = [];
          angular.forEach(response.items, function(entry) {
            results.push(ytVideoPrepare(entry));
          });
		  console.log('results'+results);
          defer.resolve(results);
        })
        .error(function() {
          return 'failure';
        });
      return defer.promise;
    };
  }])

  .factory('ytVideo', ['$q', '$http', 'ytVideoPrepare', 'YT_VIDEO_URL',
               function($q,   $http,   ytVideoPrepare,   YT_VIDEO_URL) {

    return function(id) {
      var defer = $q.defer();
      var url = YT_VIDEO_URL.replace('{ID}', id);
      $http.get(url)
        .success(function(response) {
          defer.resolve(ytVideoPrepare(response.entry));
        })
        .error(function() {
          return 'failure';
        });
      return defer.promise;
    };
  }])
.factory('ytVideoWatch', ['$q', '$http', 'ytVideoDetails', 'YT_VIDEO_URL',
               function($q,   $http,   ytVideoDetails,   YT_VIDEO_URL) {

    return function(id) {
      var defer = $q.defer();
      var url = YT_VIDEO_URL.replace('{ID}', id);
      $http.get(url)
        .success(function(response) {
          defer.resolve(ytVideoDetails(response.items[0]));
        })
        .error(function() {
          return 'failure';
        });
      return defer.promise;
    };
  }])
  .factory('ytVideoPrepare', ['ytCreateEmbedURL','ytCreateEmbedURLChannel',
                      function(ytCreateEmbedURL,ytCreateEmbedURLChannel) {
    return function(entry) {

	var id ='';
	var url='';
	
	if(typeof(entry.id.videoId) != "undefined"){
	  id = entry.id.videoId;
	  url = ytCreateEmbedURL(id);
	}
	  console.log('id'+id);
      var thumbnails  = [];

      var hqVideo;
      angular.forEach(entry.snippet.thumbnails || [], function(thumb) {
        var image = {
          width : thumb.width,
          height : thumb.height,
          url : thumb.url,
          name : thumb.url
        };
        if(image.name === 'hqdefault') {
          hqVideo = hqVideo || image;
        }
		var aux =image.name.split("/");
		id=aux[aux.length-2];
		url = ytCreateEmbedURL(id);
		
        thumbnails.push(image);
      });

	  
	  
      return {
        id : id,
        image : hqVideo || thumbnails[0],
        thumbnails : thumbnails,
        title : entry.snippet.title,
        description : entry.snippet.description,
        rating : 10,
        keywords : entry.snippet.title|| '',
        embedUrl : url
      };
    };
  }])
.factory('ytVideoDetails', ['ytCreateEmbedURL',
                      function(ytCreateEmbedURL) {
    return function(entry) {
	 
	  var id          = entry.id;
	  
	  console.log('id'+id);
      var thumbnails  = [];

      var hqVideo;
      angular.forEach(entry.snippet.thumbnails || [], function(thumb) {
        var image = {
          width : thumb.width,
          height : thumb.height,
          url : thumb.url,
          name : thumb.url
        };
        if(image.name === 'hqdefault') {
          hqVideo = hqVideo || image;
        }
		
        thumbnails.push(image);
      });

	
      return {
        id : id,
        image : hqVideo || thumbnails[0],
        thumbnails : thumbnails,
        title : entry.snippet.title,
        description : entry.snippet.description,
        rating : 10,
        keywords : entry.snippet.title|| '',
        embedUrl : ytCreateEmbedURL(id)
      };
    };
  }])
  .factory('ytVideoComments', ['$http', '$q', 'YT_VIDEO_COMMENTS_URL',
                       function($http,   $q,   YT_VIDEO_COMMENTS_URL) {
    return function(id) {
      var url = YT_VIDEO_COMMENTS_URL.replace('{ID}', id);
      var defer = $q.defer();
      $http.get(url)
        .success(function(response) {
          var comments = [];
          angular.forEach(response.feed.entry, function(comment) {
            comments.push({
              author : comment.author[0].name.$t,
              content : comment.content.$t
            });
          });
          defer.resolve(comments);
        })
        .error(function() {
          defer.reject();
        });
      return defer.promise;
    };
  }])

  .factory('ytCreateEmbedURL', ['YT_EMBED_URL',
                        function(YT_EMBED_URL) {
    return function(id) {
      return YT_EMBED_URL.replace('{ID}', id);
    };
  }])
  .factory('ytCreateEmbedURLChannel', ['YT_EMBED_URL_CHANNEL',
                        function(YT_EMBED_URL_CHANNEL) {
    return function(id) {
      return YT_EMBED_URL_CHANNEL.replace('{ID}', id);
    };
  }])

  .factory('ytCreatePosterUrl', ['YT_POSTER_URL',
                         function(YT_POSTER_URL) {
    return function(id) {
      return YT_POSTER_URL.replace('{ID}', id);
    };
  }])

  .directive('ytVideoPlayer', ['ytCreateEmbedURL', 'ytCreatePosterUrl',
                       function(ytCreateEmbedURL,   ytCreatePosterUrl) {
    return {
      controller: ['$scope', function($scope) {
        $scope.video_src = ytCreateEmbedURL($scope.video_id);
        $scope.video_poster = ytCreatePosterUrl($scope.video_id);
      }],
      scope: {
        video_id: '@ytVideoPlayer'
      },
      template: '<div class="yt-player-container">' +
                '  <div ng-if="active">' +
                '    <iframe ng-src="{{ video_src }}" class="yt-video-player"></iframe>' +
                '  </div>' +
                '  <div ng-click="active=true" ng-hide="active" class="yt-video-poster">' +
                '    <img ng-src="{{ video_poster }}" />' +
                '    <span class="yt-video-play-button fa fa-play"></span>' +
                '  </div>' +
                '</div>',
      replace: true
    };
  }]);
