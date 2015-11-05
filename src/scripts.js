function RootController($scope, $http, $document, $sce, DevclubUtil) {
  var currentScrollTop = 0;
  $document.on('scroll', function (a, b) {
    if (currentScrollTop < 20 && $document.scrollTop() > 20
      || currentScrollTop > 20 && $document.scrollTop() < 20) {
      currentScrollTop = $document.scrollTop();
      $scope.navbarClass = $document.scrollTop() > 20 ? 'navbar-fixed-top' : '';
      $scope.$apply();
    }
  });

  $scope.activeTab = 'MEETING';
  $scope.today = new Date();
  $scope.filterYears = DevclubUtil.getFilterYears();
  $scope.filter = {
    checkYear: function () {
      // for better search: by default the year in filter is current when user starts to search by text,
      // we want to search everywhere, if year was not changed by user
      if (this.yearChanged) {
        return;
      }
      if (this.text) {
        this.year = null;
      } else {
        this.year = $scope.filterYears[0];
      }
    },
    yearChanged: false,
    text: '',
    year: $scope.filterYears[0]
  }

  $scope.showSpeeches = function (speakerName) {
    $scope.filter.text = speakerName;
    $scope.filter.year = null;
    $scope.activeTab = 'MEETING';
    $document.scrollTo(angular.element(document.getElementById('archive')), 60, 200);
  }

  $scope.getEmbedYoutubeUrl = function (youtubeId) {
    return $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + youtubeId);
    //return "https://www.youtube.com/embed/" + youtubeId;
  }

  $scope.getVideoUrls = function (speech) {
    if (!speech.youtubeIds) {
      return speech._vids;
    }
    return _.map(speech.youtubeIds, function (youtubeId) {
      return 'https://www.youtube.com/watch?v=' + youtubeId;
    });
  }

  $http.get("data/sponsors.json").success(function (data) {
    $scope.sponsors = data;
  })
  $http.get("data/members.json").success(function (data) {
    $scope.members = data;
  });
  $http.get("data/places.json").success(function (data) {
    $scope.places = data;
  });

  function prepareData(meetings, speeches) {
    $scope.meetings = DevclubUtil.prepareMeetings(meetings, speeches);
    $scope.state = DevclubUtil.getMeetingState($scope.meetings);
    $scope.topSpeeches = DevclubUtil.getTopSpeechesList(speeches);
    $scope.topSpeakers = DevclubUtil.getTopSpeakersList(speeches);
  }

  $http.get("data/meetings.json").success(function (meetings) {
    $http.get("data/speeches.json").success(function (speeches) {
      $http.get("data/speakers.json").success(function (speakers) {
        $scope.speakers = speakers;
        prepareData(meetings, speeches);
      });
    });
  });
}

function DevclubUtil() {
  return {
    getFilterYears: function () {
      var result = [];
      var currentYear = new Date().getFullYear();
      while (currentYear >= 2008) {
        result.push(currentYear);
        currentYear--;
      }
      return result;
    },
    getTopSpeechesList: function (speeches) {
      return _.chain(speeches)
        .filter(function (speech) {
          return speech.top;
        })
        .groupBy(function (speech) {
          return speech.top.year;
        })
        .map(function (value, key) {
          return {year: key, speeches: value}
        })
        .sortBy(function (value) {
          return value.year * -1;
        })
        .value();
    },
    getTopSpeakersList: function (speeches) {
      var self = this, groups = {};
      _.each(speeches, function (speech) {
        speech.date = self.toDateObject(speech.date);
        _.each(speech.speakers, function (speaker) {
          groups[speaker] = groups[speaker] || {name: speaker, date: null, tops: [], speechCount: 0};
          groups[speaker].speechCount++;
          if (groups[speaker].date === null
            || moment(groups[speaker].date).isBefore(speech.date)) {
            groups[speaker].date = speech.date;
          }
          if (speech.top) {
            groups[speaker].tops.push(speech.top);
          }
        });
      });

      return _.chain(groups)
        .values()
        .sortBy(function (speaker) {
          return speaker.date;
        })
        .value()
        .reverse();
    },
    toDateObject: function (date, time) {
      return moment(date + (time ? time : '00:00'), 'DD.MM.YYYYHH:mm').toDate();
    },
    prepareMeetings: function (meetings, speeches) {
      var self = this;
      return _.chain(meetings)
        .map(function (meeting) {
          meeting.speeches = _.where(speeches, {date: meeting.date});
          meeting.date = self.toDateObject(meeting.date, meeting.time);
          delete meeting.time;
          delete meeting.moderator;
          return meeting;
        })
        .sortBy(function (meeting) {
          return meeting.date;
        })
        .value()
        .reverse();
    },
    getMeetingState: function (meetings) {
      var state = {next: null, lastPhotos: [], lastYoutubeIds: []}, today = new Date();
      _.each(meetings, function (meeting) {
        var current = moment(meeting.date);
        if (current.isAfter(today)
          && (state.next === null || current.isBefore(state.next.date))) {
          state.next = meeting;
          state.next.showDate = true;
          state.next.showLocation = state.next.place != undefined && state.next.place.length > 0;
          state.next.showRegistration = state.next.registerUrl != undefined && state.next.registerUrl.length > 0;
        }
        if (_.size(state.lastPhotos) < 7 && current.isBefore(today)) {
          _.each(meeting.photoUrls, function (url) {
            state.lastPhotos.push({date: meeting.date, name: meeting.name + ' (' + meeting.place + ')', url: url});
          })
        }
        if (_.size(state.lastYoutubeIds) < 6 && current.isBefore(today)) {
          _.each(meeting.speeches, function (speech) {
            _.each(speech.youtubeIds, function (youtubeId) {
              state.lastYoutubeIds.push(youtubeId);
            });
          });
        }
      });
      return state;
    }
  };
}

angular.module('devclub', ['ngLocale', 'duScroll'])
  .controller('RootController', RootController)
  .factory('DevclubUtil', DevclubUtil)
  .directive('medal', function () {
    return {restrict: 'E', replace: true, scope: {year: '=', place: '='}, templateUrl: 'devclub-medal.html'}
  })
  .directive('user', function () {
    return {restrict: 'E', replace: true, templateUrl: 'devclub-user.html'}
  })
  .directive('gaClick', function () {
    return {
      restrict: 'A', scope: {gaClick: '@'}, link: function (scope, element) {
        element.bind("click", function () {
          var params = scope.gaClick.split('|||');
          ga(
            'send',
            'event',
            params[0],
            params[1],
            params.length > 2 ? params[2] : undefined,
            params.length > 3 ? params[3] : undefined
          );
        });
      }
    }
  })
  // fucking fix to close mobile menu on menu item click
  .directive('closeNavbarOnClick', function () {
    return {
      restrict: 'A', link: function (scope, element) {
        element.bind("click", function () {
          $('.navbar-toggle').click();
        });
      }
    }
  });