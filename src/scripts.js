function Config($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('#');
}

function Run($location, $window) {
  if ($location.path() && $location.path() != "/") {
    $window.location = "https://blog.devclub.eu" + $location.path();
  }
}

function RootController($scope, $http, $location, $document, $anchorScroll, $sce, DevclubUtil) {
  var DATA_HOST = "https://devclub.github.io/devclubeu.github.io/";
  var EVENTBRITE_TOKEN = "AWURDQ7N6QCZES6ZQNVG";
  var EVENTBRITE_ORGANIZATION = "910302825";
  var EVENTBRITE_URL = "https://www.eventbriteapi.com/v3/events/search/?token=" + EVENTBRITE_TOKEN + "&organizer.id=" + EVENTBRITE_ORGANIZATION;

  $scope.$on('$locationChangeStart', function(event, next, current) {
    if($location.hash() == 'commerce'){
      $scope.sponsorText.show = true;
    }
  });

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
  $scope.sponsorText = {};
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
    if ($location.hash() !== 'archive') {
      $location.hash('archive');
    } else {
      $anchorScroll();
    }
  }

  var meetingSpeechRows = [];
  $scope.getMeetingSpeechRows = function () {
    if (meetingSpeechRows.length > 0) {
      return meetingSpeechRows;
    }
    if (!$scope.state || !$scope.state.next || !$scope.state.next.speeches || $scope.state.next.speeches.length == 0) {
      return meetingSpeechRows;
    }
    var speeches = $scope.state.next.speeches;
    var size = speeches.length;
    if (size < 5) {
      meetingSpeechRows = [speeches];
    } else if (size < 7) {
      meetingSpeechRows = [speeches.slice(0, 3), speeches.slice(3, size)];
    } else if (size < 9) {
      meetingSpeechRows = [speeches.slice(0, 4), speeches.slice(4, size)];
    }
    return meetingSpeechRows;
  }

  $scope.getDaysLeft = function (date) {
    return moment(date).fromNow();
  }

  $scope.registrationFinished = function (date) {
    var sec = moment.duration(moment(date).diff(new Date())).asSeconds();
    return sec < 4 * 24 * 60 * 60;
  }

  $scope.getEmbedYoutubeUrl = function (youtubeId) {
    return $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + youtubeId);
  }

  $scope.trustAsHtml = function (html) {
    return $sce.trustAsHtml(html);
  }

  $scope.getVideoUrls = function (speech) {
    if (!speech.youtubeIds) {
      return speech._vids;
    }
    return _.map(speech.youtubeIds, function (youtubeId) {
      return 'https://www.youtube.com/watch?v=' + youtubeId;
    });
  }

  $http.get(DATA_HOST + "data/sponsors.json").success(function (data) {
    $scope.sponsors = data;
  })
  $http.get(DATA_HOST + "data/members.json").success(function (data) {
    $scope.members = data;
  });
  $http.get(DATA_HOST + "data/places.json").success(function (data) {
    $scope.places = data;
  });

  function prepareData(meetings, speeches, eventbriteData) {
    $scope.meetings = DevclubUtil.prepareMeetings(meetings, speeches);

    // this sets the year of the latest meeting
    if ($scope.meetings.length > 0) {
      $scope.filter.year = $scope.meetings[0].date.getFullYear();
    }

    var event;
    if (eventbriteData && eventbriteData.events && eventbriteData.events.length > 0) {
      event = eventbriteData.events[0];
    }

    $scope.state = DevclubUtil.getMeetingState($scope.meetings, event);
    $scope.topSpeeches = DevclubUtil.getTopSpeechesList(speeches);
    $scope.topSpeakers = DevclubUtil.getTopSpeakersList(speeches);
  }

  $http.get(DATA_HOST + "data/meetings.json").success(function (meetings) {
    $http.get(DATA_HOST + "data/speeches.json").success(function (speeches) {
      $http.get(DATA_HOST + "data/speakers.json").success(function (speakers) {
        $http.get(EVENTBRITE_URL).success(function (eventbriteData) {
          $scope.speakers = speakers;
          prepareData(meetings, speeches, eventbriteData);
        });
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
    getMeetingState: function (meetings, event) {
      var state = {lastPhotos: [], lastYoutubeIds: []}, today = new Date();
      _.each(meetings, function (meeting) {
        var current = moment(meeting.date);
        if (current.isAfter(today) && (state.next === undefined || current.isBefore(state.next.date))) {
          state.next = meeting;
          if (event && !state.next.registerUrl) {
            state.next.registerUrl = event.url;
          }
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

      if (event) {
        if (!state.next) {
          state.next = {};
          state.next.date = event.start && event.start.local ? new Date(event.start.utc) : undefined;
          state.next.registerUrl = event.url;
          state.next.showRegistration = state.next.registerUrl != undefined && state.next.registerUrl.length > 0;
        }
        state.next.event = {};
        state.next.event.name = event.name.html;
        state.next.event.description = event.description.html;
      }

      if (state.next) {
        var date = moment(state.next.date), format = "YYYYMMDD\THHmmss";
        state.next.addToGoogleCalendarUrl =
          "http://www.google.com/calendar/event?action=TEMPLATE&text=Devclub+встреча"
          + "&dates="
          + date.format(format)
          + "/"
          + date.add(3, 'hours').format(format)
          + (state.next.registerUrl ? "&details=Больше+деталей+" + state.next.registerUrl : "")
          + (state.next.place ? "&location=" + state.next.place : "");
      }

      return state;
    }
  };
}

angular.module('devclub', ['ngLocale', 'ngSanitize'])
  .config(Config)
  .run(Run)
  .controller('RootController', RootController)
  .factory('DevclubUtil', DevclubUtil)
  .directive('tooltip', function () {
    return {
      restrict: 'A', scope: {tooltip: '='}, link: function (scope, element) {
        $(element).tooltip({title: scope.tooltip, placement: 'right'});
      }
    }
  })
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
          $('.navbar-collapse').collapse('hide');
        });
      }
    }
  });
