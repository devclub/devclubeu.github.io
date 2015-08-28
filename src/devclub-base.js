angular.module('devclub', ['ngLocale']);

function RootController($rootScope, $http, $sce, DevclubUtil) {
  $rootScope.today = new Date();
  $rootScope.filterYears = DevclubUtil.getFilterYears();
  $rootScope.filter = {
    checkYear: function () {
      // for better search: by default the year in filter is current when user starts to search by text,
      // we want to search everywhere, if year was not changed by user
      if (this.yearChanged) {
        return;
      }
      if (this.text) {
        this.year = null;
      } else {
        this.year = $rootScope.filterYears[0];
      }
    },
    yearChanged: false,
    text: '',
    year: $rootScope.filterYears[0]
  }

  $rootScope.showSpeeches = function (speakerName) {
    $rootScope.filter.text = speakerName;
    $rootScope.filter.year = null;
    $('#archive-tabs a:first').tab('show');
    $('body').scrollTo('#archive', 800, {offset: -70, 'axis': 'y', easing: 'easeOutQuad'});
  }

  $rootScope.getEmbedYoutubeUrl = function (youtubeId) {
    return $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + youtubeId);
    //return "https://www.youtube.com/embed/" + youtubeId;
  }

  $rootScope.getVideoUrls = function (speech) {
    if (!speech.youtubeIds) {
      return speech._vids;
    }
    return _.map(speech.youtubeIds, function (youtubeId) {
      return 'https://www.youtube.com/watch?v=' + youtubeId;
    });
  }

  $http.get("data/sponsors.json").success(function (data) {
    $rootScope.sponsors = data;
  })
  $http.get("data/members.json").success(function (data) {
    $rootScope.members = data;
  });
  $http.get("data/places.json").success(function (data) {
    $rootScope.places = data;
  });

  function prepareData(meetings, speeches) {
    $rootScope.meetings = DevclubUtil.prepareMeetings(meetings, speeches);
    $rootScope.state = DevclubUtil.getMeetingState(meetings);
    $rootScope.topSpeeches = DevclubUtil.getTopSpeechesList(speeches);
    $rootScope.topSpeakers = DevclubUtil.getTopSpeakersList(speeches);
  }

  $http.get("data/meetings.json").success(function (meetings) {
    $http.get("data/speeches.json").success(function (speeches) {
      prepareData(meetings, speeches);
    });
  });

}

angular.module('devclub').controller('RootController', RootController);
