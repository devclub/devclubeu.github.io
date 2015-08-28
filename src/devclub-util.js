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
        }
        if (_.size(state.lastPhotos) < 3 && current.isBefore(today)) {
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

angular.module('devclub').factory('DevclubUtil', DevclubUtil);